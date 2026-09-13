# MP12 Inventory

Vite + vanilla JavaScript inventory aplikace navazující na původní Botanic/WMS koncept.

## Princip UI

Aplikace má jeden pracovní viewport. `Pages` se nepíšou pod sebe: při přepnutí se nová stránka překryje přes aktuální a stará se po krátké animaci odstraní. Tabulky tedy zůstávají ve stejném prostoru.

Pages:

`Zásoby` · `Pozice` · `Pohyby` · `Suroviny` · `Inventury`

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
- Warehouse grid pozic
- Inventury
- CSV import/export skladu
- Dark/light motiv
- Kompaktní zobrazení
- Lokální persistence bez backendu

## CSV

Export vytváří `mp12-sklad-YYYY-MM-DD.csv` se středníkem jako oddělovačem a BOM pro Excel.

Import očekává hlavičky:

```text
id;material;lot;expiry;box;position;qty;packState
```

Při importu může být `material` ID nebo přesný název suroviny. Neznámý název se automaticky přidá do katalogu.

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
