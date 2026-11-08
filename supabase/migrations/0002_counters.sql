-- Števci: kategorije (npr. Tek), kjer beležiš, kolikokrat si nekaj naredil.
-- Vsak vnos ima dan in opombo; letni seštevek se izračuna iz vnosov.
-- Števec z enoto (npr. km) šteje količino: vsak vnos ima amount, cilj je v
-- isti enoti (npr. 2000 km) in na strani se preostanek odšteva.

create table public.bingo_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text not null default 'orange' check (char_length(color) <= 20),
  goal int check (goal is null or goal between 1 and 1000000),
  unit text check (unit is null or char_length(unit) between 1 and 12),
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.bingo_counter_entries (
  id uuid primary key default gen_random_uuid(),
  counter_id uuid not null references public.bingo_counters (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null default current_date,
  amount numeric(12, 2) check (amount is null or amount > 0),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index bingo_counters_user_idx on public.bingo_counters (user_id);
create index bingo_counter_entries_counter_day_idx on public.bingo_counter_entries (counter_id, day);
create index bingo_counter_entries_user_day_idx on public.bingo_counter_entries (user_id, day);

alter table public.bingo_counters enable row level security;
alter table public.bingo_counter_entries enable row level security;

create policy "bingo_counters_own" on public.bingo_counters
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "bingo_counter_entries_own" on public.bingo_counter_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.bingo_counters c
      where c.id = counter_id and c.user_id = (select auth.uid())
    )
  );
