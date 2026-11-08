// Barve kartic števcev: ključ → dvobarvni preliv (inline style, ne Tailwind razredi).

export type CounterColor = { key: string; name: string; a: string; b: string };

export const COUNTER_COLORS: CounterColor[] = [
  { key: "orange", name: "Oranžna", a: "#f97316", b: "#dc2626" },
  { key: "rose", name: "Rožnata", a: "#fb7185", b: "#be185d" },
  { key: "violet", name: "Vijolična", a: "#a78bfa", b: "#4f46e5" },
  { key: "blue", name: "Modra", a: "#60a5fa", b: "#1d4ed8" },
  { key: "cyan", name: "Turkizna", a: "#22d3ee", b: "#0f766e" },
  { key: "green", name: "Zelena", a: "#4ade80", b: "#15803d" },
  { key: "lime", name: "Limeta", a: "#bef264", b: "#65a30d" },
  { key: "amber", name: "Jantarna", a: "#fcd34d", b: "#ea580c" },
  { key: "pink", name: "Fuksija", a: "#f472b6", b: "#7c3aed" },
  { key: "slate", name: "Grafitna", a: "#94a3b8", b: "#334155" },
];

export function counterColor(key: string): CounterColor {
  return COUNTER_COLORS.find((c) => c.key === key) ?? COUNTER_COLORS[0];
}

export function gradient(key: string, angle = 135) {
  const c = counterColor(key);
  return `linear-gradient(${angle}deg, ${c.a}, ${c.b})`;
}
