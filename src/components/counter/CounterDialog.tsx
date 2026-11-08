"use client";

import { useState, useTransition } from "react";
import type { BingoCounter } from "@/lib/types/database.types";
import { COUNTER_COLORS, gradient } from "@/lib/counter/colors";
import { deleteCounterAction, saveCounterAction } from "@/actions/counters";
import { Field, Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/icons";
import Sheet from "./Sheet";

/** Nov števec ali urejanje obstoječega: ime, barva, neobvezen letni cilj. */
export default function CounterDialog({
  counter,
  defaultName = "",
  defaultColor = "orange",
  onClose,
  onDeleted,
}: {
  counter: BingoCounter | null;
  defaultName?: string;
  defaultColor?: string;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const [name, setName] = useState(counter?.name ?? defaultName);
  const [color, setColor] = useState(counter?.color ?? defaultColor);
  const [goal, setGoal] = useState(counter?.goal ? String(counter.goal) : "");
  const [useUnit, setUseUnit] = useState(!!counter?.unit);
  const [unit, setUnit] = useState(counter?.unit ?? "km");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveCounterAction({
        id: counter?.id ?? null,
        name,
        color,
        goal: goal ? Number(goal) : null,
        unit: useUnit ? unit.trim() || null : null,
      });
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  function remove() {
    if (!counter) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    start(async () => {
      const res = await deleteCounterAction(counter.id);
      if (res.error) setError(res.error);
      else (onDeleted ?? onClose)();
    });
  }

  return (
    <Sheet
      background={`radial-gradient(circle at 10% 0%, rgba(255,255,255,0.35), transparent 60%), ${gradient(color)}`}
      onClose={onClose}
      header={
        <div className="pr-10">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
            {counter ? "Uredi števec" : "Nov števec"}
          </div>
          <div className="mt-1 truncate text-2xl font-black uppercase tracking-wider">{name.trim() || "Ime števca"}</div>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ime" htmlFor="counter-name">
          <Input
            id="counter-name"
            value={name}
            maxLength={40}
            autoFocus={!counter}
            placeholder="npr. Tek"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

        <div>
          <div className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">Barva</div>
          <div className="grid grid-cols-5 gap-2">
            {COUNTER_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={color === c.key}
                onClick={() => setColor(c.key)}
                className="flex aspect-square items-center justify-center rounded-2xl text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                style={{ background: gradient(c.key) }}
              >
                {color === c.key && <IconCheck className="h-5 w-5" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* Enota: števec šteje količino (npr. km) in odšteva od cilja. */}
        <div className="rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={useUnit}
              onChange={(e) => setUseUnit(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-orange-600"
            />
            <span className="text-sm">
              <span className="font-medium text-gray-800 dark:text-gray-200">Štej količino v enoti</span>
              <span className="block text-gray-500 dark:text-gray-400">
                Pri vsakem vnosu vpišeš količino (npr. 42 km), od cilja se odšteva.
              </span>
            </span>
          </label>
          {useUnit && (
            <div className="mt-3 flex items-center gap-2 pl-8">
              <Input
                aria-label="Enota"
                value={unit}
                maxLength={12}
                placeholder="km"
                onChange={(e) => setUnit(e.target.value)}
                className="w-28"
                required
              />
              <div className="flex flex-wrap gap-1">
                {["km", "m", "h", "kg"].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className="rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}
          {counter && counter.unit && !useUnit && (
            <p className="mt-2 pl-8 text-xs text-amber-600 dark:text-amber-400">
              Brez enote se šteje samo število vnosov; vpisane količine ostanejo shranjene.
            </p>
          )}
        </div>

        <Field
          label={useUnit && unit.trim() ? `Letni cilj v ${unit.trim()} (neobvezno)` : "Letni cilj (neobvezno)"}
          htmlFor="counter-goal"
        >
          <Input
            id="counter-goal"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000000}
            placeholder={useUnit ? "npr. 2000" : "npr. 50"}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex items-center gap-2">
          {counter && (
            <Button type="button" variant={confirmDelete ? "danger" : "ghost"} onClick={remove} disabled={pending}>
              {confirmDelete ? "Res izbriši z vsemi vnosi?" : "Izbriši"}
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            Prekliči
          </Button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md px-4 py-2 text-sm font-bold text-white shadow-md transition-transform active:scale-95 disabled:opacity-60"
            style={{ background: gradient(color, 90) }}
          >
            {counter ? "Shrani" : "Ustvari"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
