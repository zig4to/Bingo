import type { SupabaseClient } from "@supabase/supabase-js";
import type { BingoCounter, BingoCounterEntry, Database } from "@/lib/types/database.types";

type Client = SupabaseClient<Database>;

/** Današnji datum (YYYY-MM-DD) po ljubljanskem času. */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Ljubljana" }).format(new Date());
}

export async function getCounters(supabase: Client): Promise<BingoCounter[]> {
  const { data } = await supabase
    .from("bingo_counters")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Vsi vnosi vseh števcev v letu, najnovejši najprej. */
export async function getEntries(supabase: Client, year: number): Promise<BingoCounterEntry[]> {
  const { data } = await supabase
    .from("bingo_counter_entries")
    .select("*")
    .gte("day", `${year}-01-01`)
    .lte("day", `${year}-12-31`)
    .order("day", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}
