-- Bingo: letni bingo ciljev. Vsak uporabnik ima svoje table (ena na leto),
-- tabla ima size × size polj.

create table public.bingo_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  year int not null check (year between 2000 and 2100),
  title text not null default 'Adventure Bingo' check (char_length(title) between 1 and 80),
  size int not null default 5 check (size between 3 and 6),
  created_at timestamptz not null default now(),
  unique (user_id, year)
);

create table public.bingo_cells (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.bingo_boards (id) on delete cascade,
  position int not null check (position >= 0 and position < 36),
  text text not null default '' check (char_length(text) <= 120),
  done boolean not null default false,
  done_at timestamptz,
  note text check (char_length(note) <= 1000),
  updated_at timestamptz not null default now(),
  unique (board_id, position)
);

create index bingo_cells_board_idx on public.bingo_cells (board_id);

alter table public.bingo_boards enable row level security;
alter table public.bingo_cells enable row level security;

create policy "bingo_boards_own" on public.bingo_boards
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "bingo_cells_own" on public.bingo_cells
  for all to authenticated
  using (exists (
    select 1 from public.bingo_boards b
    where b.id = board_id and b.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.bingo_boards b
    where b.id = board_id and b.user_id = (select auth.uid())
  ));
