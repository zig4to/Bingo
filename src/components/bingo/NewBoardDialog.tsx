"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { createBoardAction } from "@/actions/bingo";
import clsx from "@/lib/utils/clsx";

const SIZES = [3, 4, 5];

/** Nova tabla za leto; po želji prenese neopravljene cilje iz obstoječe table. */
export default function NewBoardDialog({
  open,
  onClose,
  defaultYear,
  takenYears,
  copyOptions,
  defaultTitle = "Adventure Bingo",
}: {
  open: boolean;
  onClose: () => void;
  defaultYear: number;
  takenYears: number[];
  copyOptions: { id: string; year: number }[];
  defaultTitle?: string;
}) {
  const router = useRouter();
  const [year, setYear] = useState(String(defaultYear));
  const [title, setTitle] = useState(defaultTitle);
  const [size, setSize] = useState(5);
  const [copyFrom, setCopyFrom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const y = Number(year);
  const taken = takenYears.includes(y);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createBoardAction({ year: y, title, size, copyFrom: copyFrom || null });
      if (res.error) {
        setError(res.error);
        return;
      }
      onClose();
      router.push(`/?leto=${res.year}`);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Nov bingo">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <Field label="Leto" htmlFor="year">
            <Input
              id="year"
              type="number"
              inputMode="numeric"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </Field>
          <Field label="Naslov" htmlFor="title">
            <Input id="title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
        </div>
        {taken && <p className="text-sm text-red-600 dark:text-red-400">Bingo za {y} že obstaja.</p>}

        <div>
          <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Velikost</div>
          <div className="flex gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={clsx(
                  "flex-1 rounded-md border px-3 py-2 text-sm font-medium",
                  size === s
                    ? "border-orange-600 bg-orange-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                {s} × {s}
              </button>
            ))}
          </div>
        </div>

        {copyOptions.length > 0 && (
          <Field label="Prenesi neopravljene cilje" htmlFor="copy">
            <select
              id="copy"
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:[color-scheme:dark]"
            >
              <option value="">Ne, začni s prazno tablo</option>
              {copyOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  Iz binga {o.year}
                </option>
              ))}
            </select>
          </Field>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Prekliči
          </Button>
          <Button type="submit" disabled={pending || taken || !(y >= 2000 && y <= 2100)}>
            {pending ? "Ustvarjam …" : "Ustvari"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
