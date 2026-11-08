import type { BingoCounter, BingoCounterEntry } from "@/lib/types/database.types";

/** „1958,5“ — slovenski zapis, največ 1 decimalka. */
export function fmtNum(n: number) {
  return new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 1 }).format(n);
}

/**
 * Prikaz števca:
 * - brez enote: število vnosov (do cilja = število vnosov);
 * - z enoto (npr. km): vsota količin; s ciljem se prikaže preostanek (odšteva se).
 */
export function counterStats(counter: BingoCounter, entries: BingoCounterEntry[]) {
  const count = entries.length;
  const sum = counter.unit ? entries.reduce((s, e) => s + (e.amount ?? 0), 0) : count;
  const goal = counter.goal;
  const remaining = goal !== null ? Math.max(0, goal - sum) : null;
  const pct = goal ? Math.min(100, (sum / goal) * 100) : null;
  const reached = goal !== null && sum >= goal;
  // Glavna številka na kartici: pri enoti s ciljem preostanek, sicer vsota/število.
  const main = counter.unit && remaining !== null && !reached ? remaining : sum;
  const mainLabel = counter.unit
    ? remaining !== null && !reached
      ? `${counter.unit} še do cilja`
      : `${counter.unit} letos`
    : "krat letos";
  return { count, sum, goal, remaining, pct, reached, main, mainLabel };
}
