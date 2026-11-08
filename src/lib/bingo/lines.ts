// Čiste funkcije za izračun bingo linij (brez importov).

/** Vse linije table: vrstice, stolpci, obe diagonali — vsaka kot seznam pozicij. */
export function allLines(size: number): number[][] {
  const lines: number[][] = [];
  for (let r = 0; r < size; r++) lines.push(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c++) lines.push(Array.from({ length: size }, (_, r) => r * size + c));
  lines.push(Array.from({ length: size }, (_, i) => i * size + i));
  lines.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
  return lines;
}

/** Dokončane linije in množica pozicij, ki ležijo na kateri od njih. */
export function completedLines(size: number, done: Set<number>) {
  const lines = allLines(size).filter((line) => line.every((p) => done.has(p)));
  const onLine = new Set<number>();
  for (const line of lines) for (const p of line) onLine.add(p);
  return { count: lines.length, onLine };
}
