// „2026-11-08“ → „ned., 8. nov.“
export function fmtDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("sl-SI", { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(Date.UTC(y, m - 1, d, 12))
  );
}
