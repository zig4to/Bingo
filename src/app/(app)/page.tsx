import { createClient } from "@/lib/supabase/server";
import { currentYear, getBoards, getCells } from "@/lib/data/bingo";
import BoardView from "@/components/bingo/BoardView";
import EmptyState from "@/components/bingo/EmptyState";

// Domača stran: tabla izbranega leta (?leto=YYYY), privzeto tekoče leto
// (če zanj ni table, najbližje leto).
export default async function Home({ searchParams }: { searchParams: Promise<{ leto?: string }> }) {
  const { leto } = await searchParams;
  const supabase = await createClient();
  const boards = await getBoards(supabase);
  const now = currentYear();

  if (boards.length === 0) return <EmptyState year={now} />;

  const wanted = Number(leto) || now;
  const board =
    boards.find((b) => b.year === wanted) ??
    [...boards].sort((a, b) => Math.abs(a.year - wanted) - Math.abs(b.year - wanted) || b.year - a.year)[0];
  const cells = await getCells(supabase, board.id);

  return (
    <BoardView
      key={board.id}
      board={board}
      cells={cells}
      years={boards.map((b) => ({ id: b.id, year: b.year }))}
      currentYear={now}
    />
  );
}
