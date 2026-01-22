# Data Quality Monitor

A production-style Angular 17+ SPA that monitors data feed health, anomalies, incidents, and alert rules. The UI uses Angular Material and Chart.js via ng2-charts, with a mock API that simulates latency, failures, and polling updates.

## What the app does
- **Dashboard**: feed summary cards, searchable/sortable table, anomaly breakdown chart, and live metrics chart.
- **Feed details**: per-feed SLOs, metric charts, anomalies, and linked incidents.
- **Incidents**: table, filters, create incident dialog, and incident detail timeline.
- **Rules**: simple rule builder with in-memory updates that influence anomaly generation.

## Run locally
```bash
npm install
npm start
```
Then open `http://localhost:4200`.

## Mock API behavior
- All data is stored in-memory under `src/app/core/mock-data/` and managed by `DataStoreService`.
- Requests go through the `MockBackendInterceptor` which serves `/api/*` routes.
- `MockNetworkInterceptor` adds randomized latency (250–900ms) and a 5% error rate.
- A seeded RNG keeps the UI predictable across reloads.
- Polling updates occur every ~5 seconds and may generate anomalies based on active rules.

## Deploy to Vercel (static SPA)
1. Build the app:
   ```bash
   npm run build
   ```
2. In Vercel:
   - **Framework Preset**: Angular
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/data-quality-monitor/browser`
3. The included `vercel.json` ensures SPA deep links resolve correctly.

`vercel.json` uses a rewrite to `index.html` so routes like `/feeds/feed-1` work on refresh.

## Project structure
```
src/app/
  app.config.ts
  app.routes.ts
  core/
    services/
    interceptors/
    models/
    mock-data/
  features/
    dashboard/
    feeds/
    incidents/
    rules/
  shared/
    components/
    pipes/
    utils/
```
