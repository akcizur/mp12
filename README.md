# MP12

Kompaktní statická aplikace ve stylu původního Botanic remasteru: **Pages + Tables**.

## Hlavní princip

Obsah není skládán pod sebe. Aplikace má jeden pevný pracovní viewport a do něj `includePages()` vkládá vždy právě aktivní stránku.

Při přepnutí stránky:

- aktuální page zůstane krátce pod novou page,
- nová page přijede na stejné místo,
- stará page se odstraní až po dokončení přechodu,
- výška pracovního prostoru se nemění,
- tabulky se nikdy neskládají za sebe mimo viewport.

To vytváří princip **výměny pages**, nikoli dlouhé stránky plné sekcí.

## Pages

`Přehled` · `Zásoby` · `Pozice` · `Pohyby` · `Suroviny` · `Inventura`

Každá data page používá stejný jednoduchý tabulkový pattern. Horní navigation je pouze přepínač page; hlavní pracovní prostor je vždy jediný.

## Ovládání

Globálně je k dispozici hledání, Obnovit, změna motivu a Příjem. Ve skladu jsou rychlé akce `Detail` a `Přesun`.

Data jsou lokální a nevyžadují backend.

## Spuštění

```bash
python -m http.server 8080
```

Potom otevři `http://localhost:8080`.

Projekt je připravený pro GitHub Pages.
