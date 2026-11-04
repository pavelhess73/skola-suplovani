# Evidence suplování a dozorů (EduSuplování)

Moderní webová aplikace pro evidenci a kontrolu rovnoměrnosti suplování a dohledů / dozorů vyučujících na školách s přímým importem denních exportů z **EduPage**.

## Technologický stack
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons (`lucide-react`), SheetJS (`xlsx`)
- **Backend:** Cloudflare Pages Functions (`/functions/api/`)
- **Databáze:** Cloudflare D1 (SQLite)

---

## Rychlý start

### 1. Instalace závislostí
```bash
npm install
```

### 2. Spuštění vývojového serveru

#### Varianta A: Rychlý frontendový vývoj (Vite)
Aplikace běží s ukázkovými daty a lokálním úložištěm pro okamžité vyzkoušení:
```bash
npm run dev
```
Otevřete v prohlížeči: [http://localhost:5173](http://localhost:5173)

#### Varianta B: Plná integrace s Cloudflare D1 databází (Wrangler Pages Dev)
Pro lokální běh Cloudflare Pages Functions a lokální SQLite D1 databáze:

1. Proveďte lokální migraci D1 schématu:
   ```bash
   npm run d1:migrate:local
   ```
2. Spusťte Pages Functions + Vite:
   ```bash
   npm run pages:dev
   ```

---

## Struktura projektu

```
├── functions/
│   └── api/
│       ├── upload.js          # Cloudflare Pages Function: transakční zápis vyparsovaných dat
│       └── stats.js           # Cloudflare Pages Function: agregace a filtrování statistik
├── migrations/
│   └── 0001_init.sql          # D1 migrace (tabulka substitution_records + indexy)
├── src/
│   ├── components/
│   │   ├── FileUpload.jsx     # Drag & Drop nahrání .xlsx z EduPage s okamžitou odezvou
│   │   ├── Navbar.jsx         # Horní lišta s navigací a indikátorem stavu
│   │   ├── PeriodSelector.jsx # Volič období (týden, měsíc, školní rok, vlastní rozsah)
│   │   ├── StatsTable.jsx     # Tabulka s čárkami (tallies), KPI a zvýrazněním dozorů
│   │   └── TeacherDetailModal.jsx # Rozkliknutelný detail učitele
│   ├── services/
│   │   └── api.js             # API klient s fallbackem na mock / lokální storage
│   ├── utils/
│   │   ├── edupageParser.js   # Extrakce data regexem a parsování Excelu z EduPage
│   │   └── dateUtils.js       # Výpočty týdnů, měsíců a školního roku
│   ├── App.jsx                # Hlavní aplikace
│   ├── index.css              # Tailwind CSS direktivy
│   └── main.jsx               # Vstupní bod Reactu
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── wrangler.toml              # D1 binding "DB" -> skola-suplovani-db
└── index.html
```

---

## Logika EduPage parseru (`src/utils/edupageParser.js`)
1. **Extrakce data:** Z prvních 5 řádků vyhledá datum regexem (např. `"Středa 04. 11. 2026"` nebo `"4. 11. 2026"` převede na ISO formát `"2026-11-04"`).
2. **Ignorování nevyplněných záznamů:** Ignoruje řádky bez suplujícího pedagoga (např. odpadlé hodiny bez náhrady).
3. **Kategorizace typu:**
   - **`DOZOR`**: Pokud sloupec `Typ`, `Předmět` nebo poznámka obsahuje klíčové slovo `Dohled` či `Dozor`.
   - **`HODINA`**: Všechny ostatní případy (suplování vyučovací hodiny).

---

## Nasazení na Cloudflare Pages

1. **Vytvoření D1 databáze na Cloudflare:**
   ```bash
   wrangler d1 create skola-suplovani-db
   ```
   Zkopírujte vygenerované `database_id` do souboru `wrangler.toml`.

2. **Aplikace migrací na produkční D1:**
   ```bash
   npm run d1:migrate:prod
   ```

3. **Build a deploy:**
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name skola-suplovani
   ```

