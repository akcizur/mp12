# MP12 Inventory

Vite + vanilla JavaScript inventory aplikace navazující na původní Botanic/WMS koncept.

## Princip UI

Aplikace má jeden pracovní viewport. `Pages` se nepíšou pod sebe: při přepnutí se nová stránka překryje přes aktuální a stará se po krátké animaci odstraní.

Pages:

`Zásoby` · `Pozice` · `Pohyby` · `Suroviny` · `Inventury`

## Skladová hierarchie

Stránka `Pozice` zobrazuje fyzické uložení jako hierarchii:

`Pozice → Box → Pytle`

Každá pozice A1–D10 je vlastní sekce. V jedné pozici může být více boxů. Každý box vypisuje aktivní pytle podle ID a názvu suroviny; hmotnost je zobrazena jako doplňková hodnota.

## Inventory DB

Lokální databáze je uložená v `localStorage` a obsahuje samostatné tabulky/domény:

- `materials` — ID a názvy surovin
- `packs` — pytle / balení
- `boxes` — boxy
- `positions` — skladové pozice A1–D10
- `movements` — audit příjmů, výdejů a přesunů
- `counts` — inventurní kontroly

Model zásoby používá:

`ID pytle | Název suroviny | Šarže | Expirace | Box | Pozice | Aktuální hmotnost (g) | Stav`

Expirace je pouze `mm/yy`. Hmotnosti jsou v gramech.

## Funkce

- Příjem zásoby
- Výdej z konkrétního pytle
- Přesun pytle mezi boxem a pozicí
- Detail pytle
- Řazení tabulek
- Hledání v aktuální page
- Hierarchický pohled Pozice → Box → Pytle
- Inventury
- CSV export skladu
- Dark/light motiv
- Kompaktní zobrazení
- Lokální persistence bez backendu

Import CSV není součástí aplikace.

## Vývoj

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

Repo obsahuje GitHub Actions workflow `.github/workflows/pages.yml`, které při pushi do `main` provede Vite build a nasadí `dist/` jako GitHub Pages.

Backend není potřeba.
