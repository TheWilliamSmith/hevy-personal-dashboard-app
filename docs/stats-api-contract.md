# `/stats` — as-built notes

`src/types/stats.ts` mirrors `api/src/stats/dto/stats-response.dto.ts` field for
field (verified against the running API). This file records the shape decisions
the dashboard depends on, so a change on either side is an obvious break.

## Shape facts the UI is built around

1. **Every list endpoint returns a bare array**, not a `{ data, meta }`
   envelope — unlike `/workouts`. Two conventions now coexist in the API.
2. **One metric or dimension per request.** `/stats/timeseries?metric=`,
   `/stats/exercises/:name/progression?metric=` and
   `/stats/distribution?dimension=` each return a single `value` column. The
   metric switchers are therefore **refetches**, not client-side recomputes, and
   weekday + rep range are two separate resources.
3. **`overview.previous` carries only four metrics** — `totalWorkouts`,
   `totalVolumeKg`, `totalSets`, `avgDurationSec`. Total reps and total time
   have no comparison, so those two KPI tiles render "No comparison" instead of
   a fabricated delta.
4. **No `comparisonLabel` is sent.** The label ("vs previous 30 days") is
   derived client-side from the selected preset in `useDashboardFilters`.
5. **`/stats/calendar` sends no `availableYears`.** The year selector is derived
   from `overview.firstWorkoutAt` / `lastWorkoutAt`.
6. **The calendar omits days without activity**, so every returned day counts as
   data — the card's empty check is `days.length === 0`, not a sum.
7. **`/stats/records` takes no range.** Records are all-time and do not refetch
   when the toolbar changes.
8. **Dates**: `timeseries.bucket`, `progression.date` and `calendar.date` are
   ISO **dates** (`2026-09-07`); everything else is an ISO **instant**. All UTC,
   matching the importer's wall-clock-as-UTC convention — `formatDate` renders
   in UTC for the same reason.
9. **Validation errors return `message` as an array**
   (`["metric must be one of: volume, sets, reps, duration, workouts"]`);
   `extractApiMessage` joins them.

## Open issues spotted against the live API

- **Epoch bucket on an empty database.** With no workouts and no `from`/`to`,
  `from` defaults to the first workout — which is null — and
  `/stats/timeseries` answers `[{"bucket":"1969-12-29","value":0,
  "workoutCount":0}]`. Returning `[]` would be truer. The dashboard treats it as
  empty either way (every value is 0), so this is cosmetic, not blocking.
- **`/stats/exercises` default `limit` is 20, max 100**; the dashboard asks for
  15 explicitly to match "top 15".
