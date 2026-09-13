# MP12

Statická aplikace pro zobrazení stránek v klasickém seznamu nebo jako překrývající se stack karet.

## Hlavní část

`includePages(items, mode)` je společný renderer pro oba režimy:

- `list` — standardní seznam
- `stack` — karty jsou absolutně pozicované, mají vlastní `z-index`, posun a rotaci a fyzicky se překrývají

Kliknutí na kartu ve stacku ji přesune na vrchol a pořadí se uloží do `localStorage`.

## Spuštění

Projekt nevyžaduje build ani backend. Pro lokální vývoj lze použít:

```bash
python -m http.server 8080
```

nebo libovolný statický server.

## GitHub Pages

Repozitář je připravený jako čistý statický web. Jako entrypoint slouží `index.html`.

## Soubory

```text
index.html
styles.css
app.js
README.md
```
