"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";

export type ActionResult = { error?: string; year?: number };

async function ctx() {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);
  if (!user) throw new Error("Nisi prijavljen.");
  return { supabase, userId: user.id };
}

function done(): ActionResult {
  revalidatePath("/", "layout");
  return {};
}

const clampSize = (n: number) => (Number.isInteger(n) && n >= 3 && n <= 6 ? n : 5);

/** Nova tabla za leto. `copyFrom` = id table, katere neopravljeni cilji se prenesejo. */
export async function createBoardAction(input: {
  year: number;
  title: string;
  size: number;
  copyFrom?: string | null;
}): Promise<ActionResult> {
  const { supabase } = await ctx();
  const year = Math.trunc(input.year);
  if (!(year >= 2000 && year <= 2100)) return { error: "Neveljavno leto." };
  const title = input.title.trim().slice(0, 80) || "Adventure Bingo";
  const size = clampSize(input.size);

  const { data: board, error } = await supabase
    .from("bingo_boards")
    .insert({ year, title, size })
    .select("id")
    .single();
  if (error || !board) {
    return { error: error?.code === "23505" ? `Bingo za ${year} že obstaja.` : "Table ni bilo mogoče ustvariti." };
  }

  if (input.copyFrom) {
    const { data: old } = await supabase
      .from("bingo_cells")
      .select("text, done, position")
      .eq("board_id", input.copyFrom)
      .order("position");
    const texts = (old ?? []).filter((c) => !c.done && c.text.trim()).map((c) => c.text.trim());
    const rows = texts.slice(0, size * size).map((text, position) => ({ board_id: board.id, position, text }));
    if (rows.length) await supabase.from("bingo_cells").insert(rows);
  }

  revalidatePath("/", "layout");
  return { year };
}

export async function updateBoardAction(id: string, title: string): Promise<ActionResult> {
  const { supabase } = await ctx();
  const t = title.trim().slice(0, 80);
  if (!t) return { error: "Vpiši naslov." };
  const { error } = await supabase.from("bingo_boards").update({ title: t }).eq("id", id);
  if (error) return { error: "Shranjevanje ni uspelo." };
  return done();
}

export async function deleteBoardAction(id: string): Promise<ActionResult> {
  const { supabase } = await ctx();
  const { error } = await supabase.from("bingo_boards").delete().eq("id", id);
  if (error) return { error: "Brisanje ni uspelo." };
  return done();
}

/** Zapiše cilj v polje (ustvari vrstico, če je še ni). */
export async function saveCellAction(input: {
  boardId: string;
  position: number;
  text: string;
  note: string;
  done: boolean;
}): Promise<ActionResult> {
  const { supabase } = await ctx();
  const text = input.text.trim().slice(0, 120);
  const note = input.note.trim().slice(0, 1000) || null;
  const isDone = input.done && !!text;
  const { data: prev } = await supabase
    .from("bingo_cells")
    .select("done, done_at")
    .eq("board_id", input.boardId)
    .eq("position", input.position)
    .maybeSingle();
  const doneAt = isDone ? (prev?.done && prev.done_at ? prev.done_at : new Date().toISOString()) : null;

  const { error } = await supabase.from("bingo_cells").upsert(
    {
      board_id: input.boardId,
      position: input.position,
      text,
      note,
      done: isDone,
      done_at: doneAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "board_id,position" }
  );
  if (error) return { error: "Shranjevanje ni uspelo." };
  return done();
}

/** Hitro kljukanje: preklopi „opravljeno“. */
export async function toggleCellAction(boardId: string, position: number, isDone: boolean): Promise<ActionResult> {
  const { supabase } = await ctx();
  const { error } = await supabase
    .from("bingo_cells")
    .update({
      done: isDone,
      done_at: isDone ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("board_id", boardId)
    .eq("position", position);
  if (error) return { error: "Shranjevanje ni uspelo." };
  return done();
}
