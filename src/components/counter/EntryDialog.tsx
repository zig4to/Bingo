"use client";

import { useState, useTransition } from "react";
import type { BingoCounter, BingoCounterEntry } from "@/lib/types/database.types";
import { counterColor, gradient } from "@/lib/counter/colors";
import { addEntryAction, deleteEntryAction, updateEntryAction } from "@/actions/counters";
import { Input, Textarea } from "@/components/ui/Input";
import { IconPencil, IconPlus, IconTrash } from "@/components/ui/icons";
import clsx from "@/lib/utils/clsx";
import Sheet from "./Sheet";
import CounterDialog from "./CounterDialog";
import { fmtDay } from "./format";

/** Klik na kartico: dodaj vnos (dan + opomba), spodaj seznam letošnjih vnosov. */
export default function EntryDialog({
  counter,
  entries,
  year,
  today,
  onClose,
}: {
  counter: BingoCounter;
  entries: BingoCounterEntry[];
  year: number;
  today: string;
  onClose: () => void;
}) {
  // Za pretekla/prihodnja leta privzeto zadnji/prvi dan tistega leta.
  const defaultDay = today.startsWith(`${year}-`) ? today : year < Number(today.slice(0, 4)) ? `${year}-12-31` : `${year}-01-01`;
  const [day, setDay] = useState(defaultDay);
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(0); // za animacijo gumba
  const [editCounter, setEditCounter] = useState(false);
  const [pending, start] = useTransition();
  const col = counterColor(counter.color);

  function reset() {
    setEditingId(null);
    setDay(defaultDay);
    setNote("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = editingId
        ? await updateEntryAction({ id: editingId, day, note })
        : await addEntryAction({ counterId: counter.id, day, note });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (!editingId) setAdded((n) => n + 1);
      reset();
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await deleteEntryAction(id);
      if (res.error) setError(res.error);
      else if (editingId === id) reset();
    });
  }

  if (editCounter) {
    return <CounterDialog counter={counter} onClose={() => setEditCounter(false)} onDeleted={onClose} />;
  }

  return (
    <Sheet
      background={`radial-gradient(circle at 10% 0%, rgba(255,255,255,0.35), transparent 60%), ${gradient(counter.color)}`}
      onClose={onClose}
      header={
        <div className="flex items-end justify-between gap-3 pr-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-bold uppercase tracking-wider">{counter.name}</h2>
              <button
                type="button"
                onClick={() => setEditCounter(true)}
                aria-label="Uredi števec"
                className="rounded-full p-1.5 hover:bg-white/20"
              >
                <IconPencil />
              </button>
            </div>
            <div className="text-sm text-white/80">
              {year}
              {counter.goal ? ` · cilj ${counter.goal}×` : ""}
            </div>
          </div>
          <span key={entries.length} className="counter-pop text-5xl font-black tabular-nums drop-shadow">
            {entries.length}
          </span>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
            className="w-auto shrink-0"
            aria-label="Datum"
          />
          <button
            type="submit"
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-white shadow-md transition-transform active:scale-95 disabled:opacity-60"
            style={{ background: gradient(counter.color, 90) }}
          >
            {editingId ? (
              "Shrani"
            ) : (
              <>
                <IconPlus strokeWidth={2.5} key={added} className="counter-pop h-4 w-4" /> Dodaj
              </>
            )}
          </button>
        </div>
        <Textarea
          rows={2}
          maxLength={500}
          placeholder="Opomba (neobvezno) — npr. 8 km, Rožnik, s Tino"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {editingId && (
          <button type="button" onClick={reset} className="text-sm font-medium text-gray-500 hover:underline dark:text-gray-400">
            Prekliči urejanje
          </button>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>

      <div className="mt-6">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
          Vnosi {year}
        </h3>
        {entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">Še noben vnos.</p>
        ) : (
          <ol className="space-y-1">
            {entries.map((e, i) => (
              <li
                key={e.id}
                className={clsx(
                  "group flex items-start gap-3 rounded-xl px-2 py-2",
                  editingId === e.id ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                )}
              >
                <span
                  className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums text-white"
                  style={{ background: col.b }}
                >
                  {entries.length - i}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(e.id);
                    setDay(e.day);
                    setNote(e.note ?? "");
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="text-sm font-medium">{fmtDay(e.day)}</div>
                  {e.note && <div className="whitespace-pre-wrap break-words text-sm text-gray-500 dark:text-gray-400">{e.note}</div>}
                </button>
                <button
                  type="button"
                  onClick={() => remove(e.id)}
                  disabled={pending}
                  aria-label="Izbriši vnos"
                  className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                >
                  <IconTrash />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Sheet>
  );
}
