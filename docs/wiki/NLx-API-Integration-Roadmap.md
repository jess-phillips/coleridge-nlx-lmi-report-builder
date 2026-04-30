# NLx API Integration Roadmap

The current prototype uses **simulated data** to demonstrate the full report-building and PDF-export workflow. This page documents the plan for replacing the mock adapter with live calls to the NLx API.

## Current State

All data comes from `data/simulated_data.csv`, a synthetic dataset loaded and filtered in memory by `lib/data/mock-adapter.ts`. The data shape deliberately mirrors the NLx job posting feed so that the integration is a clean swap.

No UI, PDF, or chart components need to change — only the adapter layer.

## Adapter Interface

The integration target is the `DataAdapter` interface in `lib/data/adapter.ts`:

```ts
interface DataAdapter {
  getMonthlyPostings(filters: PostingFilters): Promise<MonthlyDataPoint[]>
  getSkillsData(filters: SkillsFilters): Promise<MonthlyDataPoint[]>
  getMetadata(): Promise<Metadata>
}
```

A real `NlxAdapter` implementation will satisfy this interface. Once it does, swapping it in requires changing one line in each API route (e.g., `getMockAdapter()` → `getNlxAdapter()`).

## Integration Steps

### 1. Obtain NLx API Access

- Coordinate with the NLx team to obtain API credentials and documentation
- Determine authentication method (API key, OAuth token, etc.)
- Identify the relevant endpoints for:
  - Monthly job posting counts by geography and occupation
  - Skill demand counts by occupation group
  - O*NET title/code reference data (may already be local)

### 2. Confirm Data Shape

The mock adapter produces `MonthlyDataPoint[]`:

```ts
interface MonthlyDataPoint {
  date: string        // "YYYY-MM-01"
  group: string       // O*NET code, skill label, or "Overall"
  n_postings: number
}
```

Verify that the NLx API returns data that can be mapped to this shape, or adjust the interface if the real data has additional useful fields (e.g., `n_unique_employers`, `median_salary`).

### 3. Build `NlxAdapter`

Create `lib/data/nlx-adapter.ts` implementing `DataAdapter`. Key considerations:

- **Authentication**: Store credentials in environment variables (`.env.local`), never in source code
- **Date aggregation**: If the API returns daily or weekly data, aggregate to monthly on the server before returning
- **State filtering**: Map state names/abbreviations to whatever the API expects (FIPS codes, abbreviations, etc.)
- **O*NET filtering**: Confirm whether the API filters by full 8-digit O*NET codes or 2-digit SOC major groups
- **Caching**: Consider a short-lived server-side cache (e.g., `lru-cache` or Next.js `fetch` cache with `revalidate`) to avoid re-fetching identical queries during a session
- **Error handling**: Return empty arrays (not thrown errors) for date ranges or geographies with no data, matching mock adapter behavior

### 4. Environment Configuration

Add to `.env.local` (not committed):

```
NLX_API_BASE_URL=https://api.nlx.org/v1   # example
NLX_API_KEY=your_key_here
```

### 5. Wire Up in API Routes

In each of the four API routes, replace:

```ts
const adapter = getMockAdapter()
```

with:

```ts
const adapter = process.env.NLX_API_KEY
  ? getNlxAdapter()
  : getMockAdapter()   // fallback for local dev without credentials
```

This allows developers without API access to still run the prototype locally.

### 6. Validate Against Mock Data

Before deploying, run both adapters side-by-side on the same query and compare shape and reasonable value ranges:

- Same `date` format: `YYYY-MM-01`
- Same `group` values for O*NET codes
- Posting counts in a plausible range (not zeros, not astronomical)

### 7. Update Docker Configuration

If the production deployment runs in Docker, add `NLX_API_KEY` and `NLX_API_BASE_URL` to the Docker Compose environment or to the hosting platform's secret store. Never hardcode credentials in `Dockerfile` or `docker-compose.yml`.

## Potential Enhancements Post-Integration

Once live data is flowing, these features become possible:

| Feature | Notes |
|---|---|
| **Real-time date range** | Populate start/end date pickers based on actual data availability |
| **Employer demand breakdown** | If the API exposes unique employer counts, add as an optional chart series |
| **Salary data** | If median wage data is available by occupation, add as a secondary y-axis or separate chart type |
| **More geography levels** | Metro area, county, or workforce region filtering if the API supports it |
| **Saved report templates** | Let users save and reload filter configurations |

## Timeline

This roadmap is in draft. Priorities and timeline will be set once API access and documentation are secured from the NLx team.
