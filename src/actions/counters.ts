"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { COUNTER_COLORS } from "@/lib/counter/colors";

export type ActionResult = { error?: string };

async function ctx() {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);
  if (!user) throw new Error("Nisi prijavljen.");
  return { supabase, userId: user.id };
}

function done(): ActionResult {
  revalidatePath("/stevec");
  return {};
}

const validColor = (c: string) => (COUNTER_COLORS.some((x) => x.key === c) ? c : "orange");
const validGoal = (g: number | null) => (g && Number.isInteger(g) && g >= 1 && g <= 100000 ? g : null);
const validDay = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

/** Nov ali urejen števec (id = null → nov, na konec seznama). */
export async function saveCounterAction(input: {
  id: string | null;
  name: string;
  color: string;
  goal: number | null;
}): Promise<ActionResult> {
  const { supabase } = await ctx();
  const name = input.name.trim().slice(0, 40);
  if (!name) return { error: "Vpiši ime števca." };
  const row = { name, color: validColor(input.color), goal: validGoal(input.goal) };

  if (input.id) {
    const { error } = await supabase.from("bingo_counters").update(row).eq("id", input.id);
    if (error) return { error: "Shranjevanje ni uspelo." };
  } else {
    const { data: last } = await supabase
      .from("bingo_counters")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("bingo_counters").insert({ ...row, position: (last?.position ?? -1) + 1 });
    if (error) return { error: "Števca ni bilo mogoče ustvariti." };
  }
  return done();
}

export async function deleteCounterAction(id: string): Promise<ActionResult> {
  const { supabase } = await ctx();
  const { error } = await supabase.from("bingo_counters").delete().eq("id", id);
  if (error) return { error: "Brisanje ni uspelo." };
  return done();
}

export async function addEntryAction(input: { counterId: string; day: string; note: string }): Promise<ActionResult> {
  const { supabase } = await ctx();
  if (!validDay(input.day)) return { error: "Neveljaven datum." };
  const note = input.note.trim().slice(0, 500) || null;
  const { error } = await supabase
    .from("bingo_counter_entries")
    .insert({ counter_id: input.counterId, day: input.day, note });
  if (error) return { error: "Vnosa ni bilo mogoče shraniti." };
  return done();
}

export async function updateEntryAction(input: { id: string; day: string; note: string }): Promise<ActionResult> {
  const { supabase } = await ctx();
  if (!validDay(input.day)) return { error: "Neveljaven datum." };
  const note = input.note.trim().slice(0, 500) || null;
  const { error } = await supabase.from("bingo_counter_entries").update({ day: input.day, note }).eq("id", input.id);
  if (error) return { error: "Shranjevanje ni uspelo." };
  return done();
}

export async function deleteEntryAction(id: string): Promise<ActionResult> {
  const { supabase } = await ctx();
  const { error } = await supabase.from("bingo_counter_entries").delete().eq("id", id);
  if (error) return { error: "Brisanje ni uspelo." };
  return done();
}
