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

## Supabase persistence (optional)
This app can use Supabase for persistent storage. When enabled, all reads/writes are made directly to your Supabase tables.

### 1) Install dependency
```bash
npm install @supabase/supabase-js
```

### 2) Create tables
Run this in the Supabase SQL editor:
```sql
create table if not exists feeds (
  id text primary key,
  name text,
  status text,
  error_rate numeric,
  latency_ms integer,
  anomalies text[],
  last_updated timestamptz,
  slo_error_rate numeric,
  slo_latency_ms integer
);

create table if not exists metrics (
  id text primary key,
  feed_id text references feeds(id),
  timestamp timestamptz,
  error_rate numeric,
  latency_ms integer,
  volume integer
);

create table if not exists anomalies (
  id text primary key,
  feed_id text references feeds(id),
  type text,
  severity text,
  detected_at timestamptz,
  description text,
  acknowledged boolean,
  incident_id text
);

create table if not exists incidents (
  id text primary key,
  title text,
  feed_id text references feeds(id),
  severity text,
  status text,
  owner text,
  created_at timestamptz,
  updated_at timestamptz,
  description text,
  anomalies text[],
  timeline jsonb,
  comments jsonb
);

create table if not exists rules (
  id text primary key,
  name text,
  scope text,
  feed_id text,
  metric text,
  operator text,
  threshold numeric,
  window text,
  severity text,
  enabled boolean,
  created_at timestamptz
);
```

### 3) Configure environment
Set your Supabase credentials in `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  supabase: {
    enabled: true,
    url: 'https://YOUR_PROJECT.supabase.co',
    anonKey: 'YOUR_ANON_KEY'
  }
};
```

### 4) RLS policies (development)
For quick testing, you can allow public read/write (dev only):
```sql
alter table feeds enable row level security;
alter table metrics enable row level security;
alter table anomalies enable row level security;
alter table incidents enable row level security;
alter table rules enable row level security;

create policy "public read" on feeds for select using (true);
create policy "public write" on feeds for insert with check (true);
create policy "public update" on feeds for update using (true);

create policy "public read" on metrics for select using (true);
create policy "public write" on metrics for insert with check (true);
create policy "public update" on metrics for update using (true);

create policy "public read" on anomalies for select using (true);
create policy "public write" on anomalies for insert with check (true);
create policy "public update" on anomalies for update using (true);

create policy "public read" on incidents for select using (true);
create policy "public write" on incidents for insert with check (true);
create policy "public update" on incidents for update using (true);

create policy "public read" on rules for select using (true);
create policy "public write" on rules for insert with check (true);
create policy "public update" on rules for update using (true);
```

### Notes
- Supabase mode expects data to already exist (seed it once using the mock data if needed).
- For production, lock down policies and use authenticated users.
