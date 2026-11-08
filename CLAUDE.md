# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Kaj je Bingo

Osebna aplikacija za letne cilje (uporabnik: Žiga). Dva dela:

1. **Bingo** (`/`) — letni „Adventure Bingo“: mreža ciljev (privzeto 5 × 5,
   lahko 3–6) za celo leto. Cilje vpišeš v polja in jih čez leto kljukaš.
   Vsak uporabnik ima svoje table, **ena na leto**; za naslednje leto lahko
   tablo narediš vnaprej (gumb „+ 2027“), po želji s prenosom neopravljenih
   ciljev iz prejšnje. Predloga je Žigina slika „ADventure (1).png“ (kremno
   ozadje, oranžno-rjave črte, velik „ADVENTURE“, pod njim „BINGO“).
2. **Števec** (`/stevec`) — kategorije (npr. Tek, Plezanje), kjer beležiš,
   kolikokrat letno si nekaj naredil; vsak vnos ima datum in opombo. Barvne
   kartice („pille“) na sredini zaslona, vsaka svoje barve.

Ogrodje je kopija aplikacije **Kvit** (prijava, SSO iz huba TomsStudios, tema,
PWA/service worker, UI primitivi), brez gospodinjstev — vse je na uporabnika.
Isti Supabase projekt **ProjektiBaze** (`abjnxhfxjolwwxlckkje`) kot
Pisi/Posel/Vzlet/Cekar/Kvit, tabele s predpono `bingo_`.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
`@supabase/ssr`. Barva orange `#f97316` → red `#dc2626`, znak Lucide
grid-3x3. Jezik vmesnika: slovenščina.

## Ukazi

```bash
npm install
npm run dev      # http://localhost:3008
npm run lint
npm run build
```

Ni testov (`npm test` ne obstaja).

## Okolje, deploy, zbirka aplikacij

- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (kopirano iz Kvita; enaki morajo biti na Vercelu, sicer produkcija vrne 500).
- GitHub `https://github.com/zig4to/Bingo.git` (veja `main`). Vercel deploy ob
  pushu na `main`.
- Vercel URL: **https://bingo-zig4to.vercel.app/**. Ob prvem preverjanju
  (2026-11-08) je preusmeril na `vercel.com/sso-api` = vklopljen **Deployment
  Protection** (Vercel Authentication). Za uporabo s telefona/iz huba ga
  izklopi v Vercel → Settings → Deployment Protection ali uporabi produkcijsko
  domeno iz Settings → Domains (in jo zamenjaj v TomsStudios + Iskri).
- Registrirano v zbirki (2026-11-08, commitano, push čaka na Žigino potrditev):
  TomsStudios `apps-registry.js` (id `bingo`, podnaslov „Letni cilji in
  dogodivščine“, za Kvitom, `VERZIJA` v `sw.js` → `v54`), Iskra `script.js`
  `APPS` (id `bingo`, prvi po abecedi, `iskra-v48`). **Ni** v zaganjalnik
  `apps.json` (port bi bil 3008). Drugim uporabnikom hub kartico pokaže šele,
  ko jim admin v TomsStudios `admin.html` dodeli dostop (`app_access`).
- **Pred `git push` vedno vprašaj Žigo.**

## Baza (Supabase)

| Migracija | Vsebina | Stanje |
|---|---|---|
| `0001_init` | `bingo_boards` (`user_id` default `auth.uid()`, `year`, `title` default „Adventure Bingo“, `size` 3–6, unique `(user_id, year)`), `bingo_cells` (`board_id`, `position` 0…size²−1 po vrsticah, `text` ≤ 120, `done`, `done_at`, `note`, `updated_at`, unique `(board_id, position)`), RLS: samo lastnik (celice prek table) | izvedena 2026-11-08 (`bingo_init`) |
| `seed_2026.sql` | Adventure Bingo 2026 s 25 cilji s slike za `ziga.skater@gmail.com` (idempotentno, `on conflict`) | izveden 2026-11-08 (`bingo_seed_2026`) |
| `0002_counters` | `bingo_counters` (`name` ≤ 40, `color` = ključ iz `src/lib/counter/colors.ts`, `goal` neobvezen letni cilj ≤ 1.000.000, `unit` neobvezna enota ≤ 12 znakov, `position`), `bingo_counter_entries` (`counter_id`, `user_id`, `day` date, `amount` numeric(12,2) > 0 — samo pri števcu z enoto, `note` ≤ 500), RLS: samo lastnik (vnos le v svoj števec) | **še NI izvedena** — stran Števec do takrat ne deluje |

Migracije se izvajajo prek Supabase MCP `apply_migration`. Auto mode jih
zavrača kot „Production Deploy“ — Žiga mora klic odobriti (enkratno ali s
pravilom `mcp__supabase__apply_migration` prek `/permissions`, shranjenim v
nastavitvah mape, iz katere je zagnan Claude Code, tj. `PROJEKTI`).
`execute_sql` uporabljaj samo za branje/preverjanje.

`src/lib/types/database.types.ts` je **ročno napisan** — ob novi migraciji ga
posodobi. Celice se zapišejo šele, ko jih urediš (upsert na
`(board_id, position)`); manjkajoče so prazne.

## Arhitektura

Server `src/app/(app)/*/page.tsx` → branje `src/lib/data/bingo.ts`
(`currentYear`, `getBoards`, `getCells`) in `src/lib/data/counters.ts`
(`todayIso`, `getCounters`, `getEntries`) → `"use client"` komponente.
Mutacije: `"use server"` v `src/actions/bingo.ts` in `src/actions/counters.ts`
(vsaka konča z `revalidatePath`). Ikone Lucide-slog v
`src/components/ui/icons.tsx` (`IconGrid`, `IconTally` …), brez emojijev.

**Zgornja vrstica** (`src/app/(app)/layout.tsx`): logo (mreža) → `/`, na
sredini `NavTabs` (Bingo | Števec, aktivni z oranžno-rdečim prelivom), desno
Nastavitve. Drseča vsebina in vrstica let imata razred `no-scrollbar`
(`globals.css`) — drsnik je namerno skrit.

### `/` — Bingo (`BoardView`)

- `?leto=YYYY`, privzeto tekoče leto (ljubljanski čas) ali najbližje
  obstoječe. Brez tabel → `EmptyState`.
- Zavihki let (pravi `border`, ne `ring` — ring v `overflow-x-auto` vrstici
  odreže zgornji rob) + „+ naslednje leto“ → `NewBoardDialog` (leto, naslov,
  velikost 3/4/5, „Prenesi neopravljene cilje“ iz izbrane table). Meni ⋯:
  preimenuj, izbriši.
- Naslov: če se konča z „Bingo“, je preostanek velik (`ADVENTURE`), pod njim
  „BINGO“ + leto.
- Način **Kljukaj**: **dva tapa na isto polje v 3 s** preklopita opravljeno
  (prvi tap polje obrobi in pokaže „še enkrat = opravljeno/odkljukaj“; tap
  drugam, premor ali menjava načina razveljavi). Ne `dblclick` — telefoni ga
  pojedo za povečavo. Preklop je optimističen (`overrides`, ponastavi se ob
  novih podatkih s strežnika).
- Način **Uredi**: tap = `CellDialog` (cilj, Opravljeno, opomba, Izprazni).
  Prazno polje vedno odpre urejanje. Prihodnje leto ali prazna tabla se odpre
  v načinu Uredi, sicer Kljukaj.
- Opravljeno polje: oranžen žig s kljukico; polja na dokončani liniji
  močneje obarvana. `src/lib/bingo/lines.ts` (čiste funkcije): vrstice,
  stolpci, obe diagonali. Pod tablo „X / N opravljenih“, „BINGO!“ / „N×
  BINGO“ / „Blackout!“.

### `/stevec` — Števec (`CounterBoard`)

- `?leto=YYYY` (‹ › med leti), seštevek = število vnosov v letu.
- **Števec z enoto** (checkbox „Štej količino v enoti“ v `CounterDialog`, hitre izbire km/m/h/kg): vsak vnos ima količino, cilj je v enoti (npr. 2000 km), kartica pokaže **preostanek** („1.958 km še do cilja“), ko je cilj dosežen ali ga ni, pa vsoto („km letos“). Izračun v `src/lib/counter/stats.ts` (`counterStats`, `fmtNum` = sl-SI, največ 1 decimalka). `getEntries` pretvori `amount` v število (numeric lahko pride kot niz). Izklop enote na obstoječem števcu količin ne briše, le ne prikazuje.
- Kartice (`CounterCard`): preliv iz `COUNTER_COLORS` (10 barv, inline
  `style`, ne Tailwind razredi), barvni sij, zbledela začetnica v ozadju,
  veliko število (`counter-pop` animacija ob spremembi — `key={count}`),
  napredek do `goal` („Cilj dosežen!“). Zadnja kartica „Nov števec“. Brez
  števcev: hitri predlogi (Tek, Plezanje, Kolo, Ledena voda, Odbojka, Skejt).
- Klik na kartico → `EntryDialog` (v `Sheet`: barvna glava, na telefonu od
  spodaj): datum (privzeto danes; za pretekla leta 31. 12., za prihodnja
  1. 1.), opomba, „+ Dodaj“; seznam vnosov leta — klik uredi, koš izbriše
  (brez potrditve); svinčnik → `CounterDialog` (ime, barva, letni cilj,
  brisanje z dvojno potrditvijo — izbriše tudi vse vnose).
- Spodaj „Zadnji vnosi“ (8 najnovejših vseh števcev).

### `/nastavitve`

Tema, e-pošta, odjava.

## Stanje podatkov (2026-11-08)

- Žiga (`ziga.skater@gmail.com`): Adventure Bingo **2026**, 5 × 5, 25 ciljev
  s slike (zapisani z malimi črkami, prikaz je uppercase; „Buschcraft“ ostal
  kot na sliki), nič še ni odkljukano.
- Števcev še ni (tabele ne obstajajo, glej `0002_counters`).

## Pasti

- `src/proxy.ts` matcher mora izključevati statične `.js` (`sw.js`,
  `install-promo.js`). `public/sw.js` je network-first; ob spremembi povečaj
  `VERZIJA`. V dev načinu `ServiceWorkerRegister` SW odjavi in pobriše
  predpomnilnike `bingo-*`.
- Ne kliči `setState` v `useEffect` (lint `react-hooks/set-state-in-effect`) —
  uporabi vzorec „prejšnja vrednost v stanju“ (glej `BoardView`).
- Datoteke v repoju so ob commitu CRLF (Windows); skripte, ki jih urejajo,
  naj normalizirajo `\r\n`. Za popravke z regexi/poševnicami raje Edit kot
  `node -e` v bashu.
- Velike commite je GitHub pri Kvitu zavračal (`commit_refs_rules`) —
  commitaj in pushaj v manjših kosih.
