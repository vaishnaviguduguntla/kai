# Security Vulnerability Dashboard  
**(Frontend-focused, large-dataset capable)**

This project is a **Vite + React + TypeScript** dashboard that visualizes security vulnerabilities across packages, images, and repositories.

It is intentionally designed as a **frontend-only system** that can handle **very large datasets (300MB+)** without a backend, using a **build-time preprocessing step + in-browser SQLite**.

---

## Features

### UI & UX
- **Single global FilterBar**  
  Search + severity filters + “Analysis / AI Analysis” toggles drive **all pages**.
- **Dark theme** with Material-like visual language.
- **Dynamic Recharts visualizations**  
  Charts update instantly as filters change.
- **Virtualized vulnerability list**  
  Uses `react-window` to efficiently render large result sets.
- **Compare workflow**  
  Select multiple vulnerabilities and view them side-by-side.
- **Route-based code splitting**  
  Dashboard / List / Detail / Compare pages are lazy-loaded.

---

## Quick Start (UI only)

```bash
npm install
npm run dev
```

This runs the app with the SQLite-backed data service (if a DB exists).

---

## Large Dataset Support (300MB+ JSON)

### Problem
The raw vulnerability dataset (`ui_demo.json`) is very large (~300–400MB) and cannot be efficiently:
- bundled into the frontend
- paginated directly from JSON
- queried repeatedly in memory

### Solution (Frontend-only, production-style)
1. **Preprocess once**: Convert JSON → SQLite at build time.
2. **Ship the DB**: Serve `public/vuln.db` as a static asset.
3. **Query in browser**: Use `sql.js` (SQLite compiled to WASM) inside a **Web Worker**.
4. **Use React Query**: Pagination, caching, prefetching remain unchanged.

This mimics a real backend query layer, but runs entirely in the browser.

---

## Data Setup (Required for full dataset)

### 1. Place the JSON locally
The large dataset is **not committed** to git.

Copy your file to:
```bash
src/data/ui_demo.json
```

> This path is `.gitignore`-d intentionally.

---

### 2. Build the SQLite database
This step converts JSON → `public/vuln.db`.

```bash
npm run build:db
```

Or explicitly:
```bash
npm run build:db -- --json "/absolute/path/to/ui_demo.json"
```

What this does:
- Parses the JSON
- Normalizes + deduplicates vulnerabilities
- Creates indexed SQLite tables
- Outputs `public/vuln.db`

Expected output:
```
Inserted 236,656 vulnerabilities
DB build complete.
```

---

### 3. Ensure required static assets exist

The following **must** be present:

```text
public/
  ├── vuln.db
  └── sql-wasm.wasm
```

If needed:
```bash
cp node_modules/sql.js/dist/sql-wasm.wasm public/sql-wasm.wasm
```

---

### 4. Run the app

```bash
npm run dev
```

The app now queries SQLite in a Web Worker.

---

## Architecture Overview

```
src/
├── app/
│   └── router.tsx           # Lazy-loaded routes
├── components/
│   └── FilterBar.tsx        # Global filter bar
├── store/
│   ├── filters.store.ts    # Global filter state
│   └── compare.store.ts
├── services/
│   ├── data/
│   │   ├── sqlDataService.ts   # SQLite-backed data service
│   │   └── index.ts
│   └── sql/
│       ├── sql.worker.ts    # Web Worker (sql.js)
│       └── sqlClient.ts     # Promise-based worker client
├── features/
│   ├── dashboard/           # KPIs + Recharts
│   ├── vulnerabilities/     # Virtualized list + detail
│   └── compare/
└── data/
    └── ui_demo.json         # Local only (gitignored)
```

---

## Data Flow

1. App bootstraps → initializes SQLite worker
2. React Query requests data via `dataService`
3. `sqlDataService` translates filters → SQL
4. Worker executes query against SQLite
5. Results stream back to UI (paginated)

**No UI component knows or cares where data comes from.**

---

## Performance Strategies

### Large Dataset Handling
- SQLite indexes on `severity`, `kaiStatus`, `published`, `cve`
- SQL-level pagination (`LIMIT / OFFSET`)
- Aggregations done in SQL (not JS loops)

### Rendering
- `react-window` virtualization for long lists
- `React.memo` rows + stable keys
- Chart data derived from filtered SQL results

### Network & Runtime
- `sql.js` runs in a Web Worker (no main-thread blocking)
- SQLite DB loaded once and reused
- React Query caching + prefetching enabled

---

## Why This Approach

This project demonstrates how a frontend engineer can:
- handle **backend-scale datasets**
- design **clean data contracts**
- optimize **performance without servers**
- build a system that could later swap to a real API **without UI changes**

---

## Notes for Reviewers

- Dataset is intentionally excluded from git due to size.
- Build step must be run once to generate `public/vuln.db`.
- All querying, filtering, and pagination happen in the browser via SQLite.
