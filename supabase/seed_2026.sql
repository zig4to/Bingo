-- Adventure Bingo 2026 (iz slike „ADventure (1).png“) za Žigin račun.
-- Pognati po 0001_init.sql. Če račun uporablja drug e-naslov, ga popravi spodaj.

with u as (
  select id from auth.users where email = 'ziga.skater@gmail.com'
), b as (
  insert into public.bingo_boards (user_id, year, title, size)
  select id, 2026, 'Adventure Bingo', 5 from u
  on conflict (user_id, year) do update set title = excluded.title
  returning id
)
insert into public.bingo_cells (board_id, position, text)
select b.id, g.position, g.text
from b, (values
  (0,  'Surf trip'),
  (1,  '5 novih ferat'),
  (2,  'Prehodi Julijske Alpe po SPP'),
  (3,  'Buschcraft trip with the boys'),
  (4,  '20 celih komadov na kitaro'),
  (5,  'Plezat 50x'),
  (6,  '5x turno bordanje'),
  (7,  'Na morje s kolesom'),
  (8,  '20x odbojka'),
  (9,  'Prespi v igluju'),
  (10, 'Skuhaj 2 jedi iz vsakega „kontinenta“'),
  (11, '2000 km na kolesu'),
  (12, 'Škrlatica Razor Špik'),
  (13, 'Plezanje v naravi 5x'),
  (14, '5x spanje v naravi'),
  (15, '60x v ledeno vodo'),
  (16, 'Pub kviz Garaža'),
  (17, 'Preberi dve knjigi'),
  (18, 'Fontana piva'),
  (19, '2x vrzi pikado in pojdi na izlet'),
  (20, 'Skuhaj 20 različnih juh'),
  (21, '20x skejtat'),
  (22, '5 proper dejtov s Tino'),
  (23, '200 km teka'),
  (24, 'Vzgoji 3 vrste čilijev in naredi omake')
) as g(position, text)
on conflict (board_id, position) do update set text = excluded.text;

-- Preveri: mora vrniti 25.
select count(*) from public.bingo_cells c
join public.bingo_boards bb on bb.id = c.board_id
join auth.users u on u.id = bb.user_id
where u.email = 'ziga.skater@gmail.com' and bb.year = 2026;
