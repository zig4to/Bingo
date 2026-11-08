# CLAUDE.md

## Kaj je Bingo

Letni „Adventure Bingo“: mreža ciljev (privzeto 5 × 5) za celo leto. Cilje
vpišeš v polja in jih čez leto kljukaš. Vsak uporabnik ima svoje table, ena
na leto; za naslednje leto lahko tablo narediš vnaprej (gumb „+ 2027“), po
želji s prenosom neopravljenih ciljev iz prejšnje.

Ogrodje je kopija aplikacije **Kvit** (prijava, SSO iz huba TomsStudios, tema,
PWA/service worker, UI primitivi). Isti Supabase projekt **ProjektiBaze**
(`abjnxhfxjolwwxlckkje`), tabele s predpono `bingo_`.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
`@supabase/ssr`. Barva orange `#f97316` → red `#dc2626`, znak Lucide
grid-3x3. Jezik vmesnika: slovenščina.

## Ukazi

```bash
npm run dev      # http://localhost:3008
npm run lint
npm run build
```

## Baza

| Migracija | Vsebina |
|---|---|
| `0001_init` | `bingo_boards` (`user_id`, `year`, `title`, `size` 3–6, unique `(user_id, year)`), `bingo_cells` (`board_id`, `position` 0…size²−1 po vrsticah, `text`, `done`, `done_at`, `note`, unique `(board_id, position)`), RLS: samo lastnik |

Obe izvedeni prek Supabase MCP 2026-11-08 (`bingo_init`, `bingo_seed_2026` = `supabase/seed_2026.sql`, 25 ciljev za Žigo).

`src/lib/types/database.types.ts` je ročno napisan — ob novi migraciji ga posodobi.
Polja se zapišejo šele, ko jih urediš (upsert na `(board_id, position)`); manjkajoča so prazna.

## Arhitektura

- `/` (`src/app/(app)/page.tsx`): `?leto=YYYY`, privzeto tekoče leto (ljubljanski čas) ali najbližje. → `BoardView`.
- `BoardView`: zavihki let + „+ naslednje leto“ (`NewBoardDialog`), meni (preimenuj, izbriši),
  tabla, napredek, število bingov (`src/lib/bingo/lines.ts`: vrstice, stolpci, diagonali).
  Način **Kljukaj** (dva tapa na isto polje v 3 s = preklop opravljeno, optimistično; prvi tap polje obrobi z namigom) / **Uredi** (tap = `CellDialog`).
  Prazno polje vedno odpre urejanje. Prihodnje leto ali prazna tabla se odpre v načinu Uredi.
- Naslov „Adventure Bingo“ se izriše kot velik „ADVENTURE“ + „BINGO“ pod njim.
- Mutacije: `src/actions/bingo.ts`.
- `/nastavitve`: tema, odjava.

## Pasti

- `src/proxy.ts` matcher mora izključevati statične `.js` (`sw.js`, `install-promo.js`). Ob spremembi `public/sw.js` povečaj `VERZIJA`.
- Ne kliči `setState` v `useEffect` — uporabi vzorec „prejšnja vrednost v stanju“ (glej `BoardView`).
