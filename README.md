# Security Vulnerability Dashboard (Frontend-focused)

This is a Vite + React + TypeScript dashboard that demonstrates:
- Global FilterBar that drives Dashboard + List pages
- Recharts visualizations (dynamic: they update with filters)
- Route-based code splitting via React.lazy + Suspense
- Virtualized vulnerability list via react-window

## Quick start

```bash
npm install
npm run dev
```

## Architecture

- `src/components/FilterBar`: single global FilterBar (search + severity + Analysis / AI Analysis toggles + impact meter)
- `src/store/filters.store.ts`: single source of truth for filters
- `src/services/data/*`: data service contract + implementation
  - currently uses `mockDataService` (small dataset)
  - swap with `sql.js + Worker + public/vuln.db` for full 300MB+ dataset
- `src/features/dashboard`: KPI + Recharts charts
- `src/features/vulnerabilities`: list (virtualized) + detail

## Performance

- **Code splitting**: Dashboard/List/Detail/Compare routes are lazy-loaded (`src/app/router.tsx`).
- **Virtualization**: List uses `react-window` to render only visible rows.
- **Memoization**: Row components are `React.memo` and stable keys are used for virtualization.

## Large dataset strategy (planned)

To handle 300MB+ JSON efficiently without a backend:
1. Preprocess JSON once into SQLite (`public/vuln.db`).
2. Load SQLite in the browser using `sql.js` inside a Web Worker.
3. Run filtering/sorting/pagination as SQL queries (indexed on `severity`, `kaiStatus`, `published`, `cve`, etc.).

This repository includes the UI + data service contract so the Worker implementation can be added without changing UI components.
