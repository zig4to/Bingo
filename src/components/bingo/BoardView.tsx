"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BingoBoard, BingoCell } from "@/lib/types/database.types";
import { completedLines } from "@/lib/bingo/lines";
import { deleteBoardAction, toggleCellAction, updateBoardAction } from "@/actions/bingo";
import Menu, { MenuItem } from "@/components/ui/Menu";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconCheck, IconPencil, IconPlus, IconTrash, IconTrophy } from "@/components/ui/icons";
import clsx from "@/lib/utils/clsx";
import CellDialog, { type CellDraft } from "./CellDialog";
import NewBoardDialog from "./NewBoardDialog";

type Mode = "kljukaj" | "uredi";

const TEXT_SIZE: Record<number, string> = {
  3: "text-xs sm:text-base",
  4: "text-[11px] sm:text-sm",
  5: "text-[9.5px] sm:text-xs",
  6: "text-[8px] sm:text-[11px]",
};

/** „Adventure Bingo“ → velik napis „Adventure“, pod njim „BINGO“. */
function splitTitle(title: string) {
  const m = title.trim().match(/^(.*?)\s*bingo$/i);
  return m && m[1] ? m[1] : title.trim();
}

export default function BoardView({
  board,
  cells,
  years,
  currentYear,
}: {
  board: BingoBoard;
  cells: BingoCell[];
  years: { id: string; year: number }[];
  currentYear: number;
}) {
  const router = useRouter();
  const [, startToggle] = useTransition();
  const total = board.size * board.size;

  // Optimistično kljukanje: lokalni preklopi, ki jih strežnik še ni potrdil.
  // Ob novih podatkih s strežnika jih pobrišemo (vzorec „prejšnja vrednost v stanju“).
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const [prevCells, setPrevCells] = useState(cells);
  if (prevCells !== cells) {
    setPrevCells(cells);
    setOverrides({});
  }

  const byPos = new Map(cells.map((c) => [c.position, c]));
  const slots = Array.from({ length: total }, (_, position) => {
    const c = byPos.get(position);
    const text = c?.text ?? "";
    const done = !!text && (overrides[position] ?? c?.done ?? false);
    return { position, text, note: c?.note ?? "", done, doneAt: c?.done_at ?? null };
  });
  const filled = slots.filter((s) => s.text).length;
  const doneSet = new Set(slots.filter((s) => s.done).map((s) => s.position));
  const { count: bingos, onLine } = completedLines(board.size, doneSet);

  const [mode, setMode] = useState<Mode>(board.year > currentYear || filled === 0 ? "uredi" : "kljukaj");
  const [editing, setEditing] = useState<CellDraft | null>(null);
  const [dialog, setDialog] = useState<"new" | "rename" | "delete" | null>(null);

  // Kljukanje zahteva dva tapa na isto polje: prvi ga „oboroži“ (obroba + namig),
  // drugi v 3 s preklopi opravljeno. Tap drugam ali premor prvega razveljavi.
  const [armed, setArmed] = useState<number | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function disarm() {
    if (armTimer.current) clearTimeout(armTimer.current);
    armTimer.current = null;
    setArmed(null);
  }

  function tap(slot: (typeof slots)[number]) {
    if (mode === "uredi" || !slot.text) {
      disarm();
      setEditing(slot);
      return;
    }
    if (armed !== slot.position) {
      if (armTimer.current) clearTimeout(armTimer.current);
      setArmed(slot.position);
      armTimer.current = setTimeout(() => setArmed(null), 3000);
      return;
    }
    disarm();
    const next = !slot.done;
    setOverrides((o) => ({ ...o, [slot.position]: next }));
    startToggle(async () => {
      const res = await toggleCellAction(board.id, slot.position, next);
      if (res.error) setOverrides((o) => ({ ...o, [slot.position]: !next }));
    });
  }

  const maxYear = Math.max(...years.map((y) => y.year));
  const big = splitTitle(board.title);

  return (
    <div className="space-y-4">
      {/* Leta */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {years.map((y) => (
          <Link
            key={y.id}
            href={`/?leto=${y.year}`}
            className={clsx(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums",
              y.year === board.year
                ? "border-orange-600 bg-orange-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            )}
          >
            {y.year}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setDialog("new")}
          className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium border border-dashed border-orange-400 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/40"
        >
          <IconPlus /> {maxYear + 1}
        </button>
        <div className="flex-1" />
        <Menu>
          {(close) => (
            <>
              <MenuItem onClick={() => { close(); setDialog("rename"); }}>
                <IconPencil /> Preimenuj
              </MenuItem>
              <MenuItem danger onClick={() => { close(); setDialog("delete"); }}>
                <IconTrash /> Izbriši bingo {board.year}
              </MenuItem>
            </>
          )}
        </Menu>
      </div>

      {/* Tabla */}
      <section className="rounded-2xl bg-[#fbf5ec] px-2 pb-3 pt-5 shadow-sm ring-1 ring-orange-900/10 dark:bg-gray-900 dark:ring-gray-800 sm:px-5 sm:pb-5 sm:pt-7">
        <header className="mb-4 text-center sm:mb-6">
          <h1 className="break-words text-4xl font-light uppercase leading-none tracking-wide text-orange-600 dark:text-orange-400 sm:text-6xl">
            {big}
          </h1>
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="text-xl font-black tracking-[0.45em] text-orange-900 dark:text-orange-200 sm:text-2xl">
              BINGO
            </span>
            <span className="rounded-full bg-orange-900/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-orange-900 dark:bg-orange-400/15 dark:text-orange-200">
              {board.year}
            </span>
          </div>
        </header>

        <div
          className="grid gap-px overflow-hidden rounded-md border border-orange-800/70 bg-orange-800/70 dark:border-orange-700/60 dark:bg-orange-700/60"
          style={{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` }}
        >
          {slots.map((s) => (
            <button
              key={s.position}
              type="button"
              onClick={() => tap(s)}
              title={s.note || undefined}
              className={clsx(
                "relative flex aspect-square items-center justify-center p-1 text-center uppercase leading-tight transition-colors sm:p-2",
                TEXT_SIZE[board.size] ?? TEXT_SIZE[5],
                s.done
                  ? onLine.has(s.position)
                    ? "bg-orange-200 text-orange-950 dark:bg-orange-800/70 dark:text-orange-50"
                    : "bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-100"
                  : "bg-[#fbf5ec] text-orange-900 hover:bg-orange-50 dark:bg-gray-900 dark:text-orange-100/90 dark:hover:bg-gray-800",
                mode === "uredi" && "outline-dashed outline-1 -outline-offset-4 outline-orange-300/60 dark:outline-orange-700/40",
                armed === s.position && "z-10 outline outline-2 -outline-offset-2 outline-orange-500 dark:outline-orange-400",
                "touch-manipulation select-none"
              )}
            >
              {s.text ? (
                <span className={clsx("line-clamp-5 break-words [hyphens:auto]", s.done && "opacity-60")} lang="sl">
                  {s.text}
                </span>
              ) : (
                <IconPlus className="h-4 w-4 text-orange-300 dark:text-gray-700 sm:h-5 sm:w-5" />
              )}
              {s.done && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-[58%] w-[58%] -rotate-12 items-center justify-center rounded-full border-[3px] border-orange-600/80 text-orange-600/90 dark:border-orange-400/80 dark:text-orange-400">
                    <IconCheck className="h-1/2 w-1/2" strokeWidth={3} />
                  </span>
                </span>
              )}
              {armed === s.position && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0.5 text-[8px] font-semibold normal-case text-orange-600 dark:text-orange-400 sm:bottom-1 sm:text-[10px]">
                  {s.done ? "še enkrat = odkljukaj" : "še enkrat = opravljeno"}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Napredek in način */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium tabular-nums">
              {doneSet.size} / {filled || total} opravljenih
            </span>
            {bingos > 0 && (
              <span className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                <IconTrophy />
                {doneSet.size === total ? "Blackout!" : bingos === 1 ? "BINGO!" : `${bingos}× BINGO`}
              </span>
            )}
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-[width]"
              style={{ width: `${(doneSet.size / Math.max(filled || total, 1)) * 100}%` }}
            />
          </div>
        </div>
        <div role="group" aria-label="Način" className="inline-flex rounded-lg border border-gray-300 p-0.5 dark:border-gray-700">
          {(["kljukaj", "uredi"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                disarm();
                setMode(m);
              }}
              className={clsx(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                mode === m ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              {m === "kljukaj" ? <IconCheck /> : <IconPencil />}
              {m === "kljukaj" ? "Kljukaj" : "Uredi"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {mode === "kljukaj"
          ? "Tapni cilj dvakrat, da ga označiš kot opravljenega (ali odkljukaš). Za urejanje besedila preklopi na Uredi."
          : "Tapni polje in vpiši cilj. Ko si zadovoljen, preklopi na Kljukaj."}
      </p>

      {editing && <CellDialog boardId={board.id} cell={editing} onClose={() => setEditing(null)} />}

      {dialog === "new" && (
        <NewBoardDialog
          open
          onClose={() => setDialog(null)}
          defaultYear={maxYear + 1}
          takenYears={years.map((y) => y.year)}
          copyOptions={[...years].reverse()}
          defaultTitle={board.title}
        />
      )}
      {dialog === "rename" && <RenameDialog board={board} onClose={() => setDialog(null)} />}
      {dialog === "delete" && (
        <DeleteDialog
          board={board}
          onClose={() => setDialog(null)}
          onDeleted={() => {
            setDialog(null);
            router.push("/");
          }}
        />
      )}
    </div>
  );
}

function RenameDialog({ board, onClose }: { board: BingoBoard; onClose: () => void }) {
  const [title, setTitle] = useState(board.title);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Modal open onClose={onClose} title="Preimenuj bingo">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await updateBoardAction(board.id, title);
            if (res.error) setError(res.error);
            else onClose();
          });
        }}
      >
        <Input autoFocus value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Če se naslov konča z „Bingo“, je ta beseda prikazana pod naslovom.
        </p>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Prekliči
          </Button>
          <Button type="submit" disabled={pending}>
            Shrani
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteDialog({
  board,
  onClose,
  onDeleted,
}: {
  board: BingoBoard;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Modal open onClose={onClose} title={`Izbriši bingo ${board.year}?`}>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Izbrisani bodo vsi cilji in kljukice te table. Tega ni mogoče razveljaviti.
      </p>
      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Prekliči
        </Button>
        <Button
          variant="danger"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await deleteBoardAction(board.id);
              if (res.error) setError(res.error);
              else onDeleted();
            })
          }
        >
          Izbriši
        </Button>
      </div>
    </Modal>
  );
}
