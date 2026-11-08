"use client";

import { useState } from "react";
import Link from "next/link";
import type { BingoCounter, BingoCounterEntry } from "@/lib/types/database.types";
import { COUNTER_COLORS, counterColor, gradient } from "@/lib/counter/colors";
import { IconChevronLeft, IconChevronRight, IconPlus } from "@/components/ui/icons";
import EntryDialog from "./EntryDialog";
import CounterDialog from "./CounterDialog";
import { fmtDay } from "./format";
import { counterStats, fmtNum } from "@/lib/counter/stats";

const SUGGESTIONS = ["Tek", "Plezanje", "Kolo", "Ledena voda", "Odbojka", "Skejt"];

export default function CounterBoard({
  counters,
  entries,
  year,
  currentYear,
  today,
}: {
  counters: BingoCounter[];
  entries: BingoCounterEntry[];
  year: number;
  currentYear: number;
  today: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [newCounter, setNewCounter] = useState<string | null>(null); // predlagano ime ali ""

  const byCounter = new Map<string, BingoCounterEntry[]>();
  for (const e of entries) {
    const list = byCounter.get(e.counter_id) ?? [];
    list.push(e);
    byCounter.set(e.counter_id, list);
  }
  const total = entries.length;
  const open = counters.find((c) => c.id === openId) ?? null;
  const used = new Set(counters.map((c) => c.color));
  const nextColor = COUNTER_COLORS.find((c) => !used.has(c.key))?.key ?? COUNTER_COLORS[counters.length % COUNTER_COLORS.length].key;
  const names = new Map(counters.map((c) => [c.id, c]));

  return (
    <div className="space-y-8">
      {/* Leto */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/stevec?leto=${year - 1}`}
            aria-label="Prejšnje leto"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <IconChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="min-w-24 text-center text-3xl font-black tabular-nums tracking-tight">{year}</h1>
          <Link
            href={`/stevec?leto=${year + 1}`}
            aria-label="Naslednje leto"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <IconChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total === 0 ? "Še noben vnos" : `${total} ${total === 1 ? "vnos" : total === 2 ? "vnosa" : total < 5 ? "vnosi" : "vnosov"} letos`}
          {year !== currentYear && (
            <>
              {" · "}
              <Link href="/stevec" className="font-medium text-orange-600 hover:underline dark:text-orange-400">
                nazaj na {currentYear}
              </Link>
            </>
          )}
        </p>
      </div>

      {/* Kartice */}
      {counters.length === 0 ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
            Naredi števec za stvari, ki jih želiš šteti čez leto. Tapni karto in dodaj vnos.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setNewCounter(s)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                style={{ background: gradient(COUNTER_COLORS[i % COUNTER_COLORS.length].key) }}
              >
                + {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setNewCounter("")}
            className="text-sm font-medium text-orange-600 hover:underline dark:text-orange-400"
          >
            ali svoj števec
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {counters.map((c) => (
            <CounterCard key={c.id} counter={c} entries={byCounter.get(c.id) ?? []} onClick={() => setOpenId(c.id)} />
          ))}
          <button
            type="button"
            onClick={() => setNewCounter("")}
            className="flex w-[calc(50%-0.375rem)] flex-col items-center justify-center gap-2 rounded-[2rem] border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-orange-400 hover:text-orange-500 dark:border-gray-700 dark:text-gray-500 sm:w-44"
            style={{ aspectRatio: "1 / 1.15" }}
          >
            <IconPlus className="h-8 w-8" />
            <span className="text-sm font-medium">Nov števec</span>
          </button>
        </div>
      )}

      {/* Zadnji vnosi */}
      {entries.length > 0 && (
        <section className="mx-auto max-w-md">
          <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
            Zadnji vnosi
          </h2>
          <ol className="space-y-1.5">
            {entries.slice(0, 8).map((e) => {
              const c = names.get(e.counter_id);
              if (!c) return null;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2 text-left ring-1 ring-gray-200 transition-colors hover:bg-gray-50 dark:bg-gray-900 dark:ring-gray-800 dark:hover:bg-gray-800"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: gradient(c.color) }} />
                    <span className="shrink-0 text-sm font-semibold">{c.name}</span>
                    {c.unit && e.amount !== null && (
                      <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: counterColor(c.color).b }}>
                        {fmtNum(e.amount)} {c.unit}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-500 dark:text-gray-400">{e.note}</span>
                    <span className="shrink-0 text-xs tabular-nums text-gray-400 dark:text-gray-500">{fmtDay(e.day)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {open && (
        <EntryDialog
          key={open.id}
          counter={open}
          entries={byCounter.get(open.id) ?? []}
          year={year}
          today={today}
          onClose={() => setOpenId(null)}
        />
      )}
      {newCounter !== null && (
        <CounterDialog counter={null} defaultName={newCounter} defaultColor={nextColor} onClose={() => setNewCounter(null)} />
      )}
    </div>
  );
}

function CounterCard({
  counter,
  entries,
  onClick,
}: {
  counter: BingoCounter;
  entries: BingoCounterEntry[];
  onClick: () => void;
}) {
  const col = counterColor(counter.color);
  const { sum, main, mainLabel, pct, reached } = counterStats(counter, entries);
  const mainText = fmtNum(main);
  // Dolge številke (npr. 1.958,5) pomanjšaj, da ostanejo v kartici.
  const mainSize = mainText.length <= 3 ? "text-6xl" : mainText.length <= 5 ? "text-5xl" : "text-4xl";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-[calc(50%-0.375rem)] flex-col overflow-hidden rounded-[2rem] p-4 text-left text-white transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 sm:w-44"
      style={{
        aspectRatio: "1 / 1.15",
        background: `radial-gradient(circle at 15% 0%, rgba(255,255,255,0.35), transparent 55%), ${gradient(counter.color)}`,
        boxShadow: `0 14px 30px -12px ${col.b}`,
      }}
    >
      {/* Okrasni velik znak v ozadju */}
      <span className="pointer-events-none absolute -bottom-6 -right-3 select-none text-[7rem] font-black leading-none text-white/10">
        {counter.name.slice(0, 1).toUpperCase()}
      </span>

      <div className="relative flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm font-bold uppercase leading-tight tracking-wider drop-shadow-sm">
          {counter.name}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-transform group-hover:rotate-90">
          <IconPlus className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center">
          <span key={main} className={`counter-pop ${mainSize} font-black tabular-nums leading-none drop-shadow-md`}>
            {mainText}
          </span>
          {counter.unit && (
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-white/80">{mainLabel}</span>
          )}
        </div>
      </div>

      <div className="relative">
        {pct !== null ? (
          <>
            <div className="mb-1 flex justify-between text-[11px] font-semibold text-white/85">
              <span>{reached ? "Cilj dosežen!" : "Cilj"}</span>
              <span className="tabular-nums">
                {fmtNum(sum)} / {fmtNum(counter.goal ?? 0)}
                {counter.unit ? ` ${counter.unit}` : ""}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
              <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : (
          !counter.unit && (
            <div className="text-center text-[11px] font-semibold uppercase tracking-widest text-white/75">{mainLabel}</div>
          )
        )}
      </div>
    </button>
  );
}
