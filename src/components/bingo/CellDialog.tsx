"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Input";
import { IconCheck } from "@/components/ui/icons";
import { saveCellAction } from "@/actions/bingo";
import clsx from "@/lib/utils/clsx";

export type CellDraft = { position: number; text: string; note: string; done: boolean; doneAt: string | null };

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("sl-SI", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

/** Urejanje enega polja: cilj, opravljeno, opomba. */
export default function CellDialog({
  boardId,
  cell,
  onClose,
}: {
  boardId: string;
  cell: CellDraft;
  onClose: () => void;
}) {
  const [text, setText] = useState(cell.text);
  const [note, setNote] = useState(cell.note);
  const [done, setDone] = useState(cell.done);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveCellAction({ boardId, position: cell.position, text, note, done });
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  function clear() {
    start(async () => {
      const res = await saveCellAction({ boardId, position: cell.position, text: "", note: "", done: false });
      if (res.error) setError(res.error);
      else onClose();
    });
  }

  return (
    <Modal open onClose={onClose} title={cell.text ? "Uredi cilj" : "Nov cilj"}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Cilj" htmlFor="text">
          <Textarea
            id="text"
            rows={2}
            maxLength={120}
            autoFocus={!cell.text}
            placeholder="npr. 5 novih ferat"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </Field>

        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => setDone((d) => !d)}
          className={clsx(
            "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-40",
            done
              ? "border-orange-600 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200"
              : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
          )}
        >
          <span
            className={clsx(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
              done ? "border-orange-600 bg-orange-600 text-white" : "border-gray-400 dark:border-gray-600"
            )}
          >
            {done && <IconCheck className="h-4 w-4" strokeWidth={3} />}
          </span>
          <span className="flex-1">Opravljeno</span>
          {done && cell.done && cell.doneAt && (
            <span className="text-xs font-normal opacity-70">{fmtDate(cell.doneAt)}</span>
          )}
        </button>

        <Field label="Opomba" htmlFor="note">
          <Textarea
            id="note"
            rows={2}
            maxLength={1000}
            placeholder="Kje, s kom, kako je bilo …"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex items-center gap-2">
          {cell.text && (
            <Button type="button" variant="ghost" onClick={clear} disabled={pending} className="text-red-600 dark:text-red-400">
              Izprazni
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            Prekliči
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Shranjujem …" : "Shrani"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
