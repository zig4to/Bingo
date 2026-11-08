import { createClient } from "@/lib/supabase/server";
import { currentYear } from "@/lib/data/bingo";
import { getCounters, getEntries, todayIso } from "@/lib/data/counters";
import CounterBoard from "@/components/counter/CounterBoard";

// Števci: kategorije (Tek, Plezanje …) z letnim seštevkom vnosov. ?leto=YYYY, privzeto tekoče leto.
export default async function Stevec({ searchParams }: { searchParams: Promise<{ leto?: string }> }) {
  const { leto } = await searchParams;
  const now = currentYear();
  const y = Number(leto);
  const year = Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : now;
  const supabase = await createClient();
  const [counters, entries] = await Promise.all([getCounters(supabase), getEntries(supabase, year)]);

  return <CounterBoard counters={counters} entries={entries} year={year} currentYear={now} today={todayIso()} />;
}
