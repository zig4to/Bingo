import type { SupabaseClient } from "@supabase/supabase-js";
import type { BingoBoard, BingoCell, Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

/** Tekoče leto po ljubljanskem času. */
export function currentYear(): number {
  return Number(
    new Intl.DateTimeFormat("en", { timeZone: "Europe/Ljubljana", year: "numeric" }).format(new Date())
  );
}

export async function getBoards(supabase: Client): Promise<BingoBoard[]> {
  const { data } = await supabase.from("bingo_boards").select("*").order("year", { ascending: true });
  return data ?? [];
}

export async function getCells(supabase: Client, boardId: string): Promise<BingoCell[]> {
  const { data } = await supabase
    .from("bingo_cells")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  return data ?? [];
}
