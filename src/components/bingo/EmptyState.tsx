"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { IconGrid, IconPlus } from "@/components/ui/icons";
import NewBoardDialog from "./NewBoardDialog";

export default function EmptyState({ year }: { year: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-4 text-white">
        <IconGrid className="h-10 w-10" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">Še nimaš binga</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Naredi mrežo ciljev za celo leto in jih sproti kljukaj.
        </p>
      </div>
      <Button onClick={() => setOpen(true)}>
        <IconPlus /> Nov bingo
      </Button>
      {open && (
        <NewBoardDialog open onClose={() => setOpen(false)} defaultYear={year} takenYears={[]} copyOptions={[]} />
      )}
    </div>
  );
}
