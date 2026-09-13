# MP12

Jednoduchá statická aplikace postavená kolem **Pages + Tables**.

## Princip

Vlevo jsou stránky. Kliknutím se otevře jedna stránka v hlavním prostoru. Každá datová stránka používá jednoduchou tabulku se stejným ovládáním:

- hledání,
- řazení kliknutím na hlavičku,
- `Upravit`,
- `Smazat`,
- `＋ Přidat`.

Výchozí stránky jsou `Přehled`, `Suroviny`, `Sklad`, `Pohyby` a `Pozice`.

## Ovládání

**Přehled** slouží jako startovní stránka a obsahuje rychlé statistiky a poslední pohyby.

**Suroviny / Sklad / Pohyby / Pozice** jsou obyčejné tabulky. Žádné překrývající se karty ani speciální režim stacku.

Data se ukládají lokálně do `localStorage`, takže není potřeba backend ani databáze.

## Spuštění

```bash
python -m http.server 8080
```

Potom otevři `http://localhost:8080`.

Projekt je čisté HTML/CSS/JS a je připravený pro GitHub Pages.
