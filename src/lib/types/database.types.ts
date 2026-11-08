// Ročno napisani tipi za tabele Binga v Supabase (predpona `bingo_`).
// Ustrezajo supabase/migrations/. Ob vsaki novi migraciji, ki doda
// stolpec/tabelo, jih je treba ročno posodobiti.

type Table<Row, Required extends keyof Row> = {
  Relationships: [];
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
};

export type BingoBoard = {
  id: string;
  user_id: string;
  year: number;
  title: string;
  size: number; // tabla je size × size polj
  created_at: string;
};

export type BingoCell = {
  id: string;
  board_id: string;
  position: number; // 0 … size² − 1, po vrsticah
  text: string;
  done: boolean;
  done_at: string | null;
  note: string | null;
  updated_at: string;
};

export type BingoCounter = {
  id: string;
  user_id: string;
  name: string;
  color: string; // ključ barve iz src/lib/counter/colors.ts
  goal: number | null; // letni cilj (npr. 50x), neobvezen
  position: number;
  created_at: string;
};

export type BingoCounterEntry = {
  id: string;
  counter_id: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  note: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      bingo_boards: Table<BingoBoard, "year">;
      bingo_cells: Table<BingoCell, "board_id" | "position">;
      bingo_counters: Table<BingoCounter, "name">;
      bingo_counter_entries: Table<BingoCounterEntry, "counter_id">;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
