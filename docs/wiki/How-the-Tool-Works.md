# How the Tool Works

## Architecture Overview

The NLx LMI Report Builder is a **Next.js 16 App Router** application. All UI runs client-side in the browser; PDF generation runs server-side in a Node.js API route so that `@react-pdf/renderer` has access to a full Node environment.

```
Browser (React)
  └── ReportManager (components/report/ReportManager.tsx)
        ├── Preview charts → GET /api/chart-data or /api/skills-data
        └── Export PDF     → POST /api/pdf → returns PDF binary

Server (Node.js API routes)
  ├── /api/chart-data     → fetches trend data via data adapter
  ├── /api/skills-data    → fetches skills data via data adapter
  ├── /api/metadata       → O*NET titles + group lists
  └── /api/pdf            → fetches all data, renders PDF, streams binary
```

## Data Layer

The data layer is intentionally thin so that switching from mock to real data is a drop-in change.

### Interface (`lib/data/adapter.ts`)

```ts
interface DataAdapter {
  getMonthlyPostings(filters: PostingFilters): Promise<MonthlyDataPoint[]>
  getSkillsData(filters: SkillsFilters): Promise<MonthlyDataPoint[]>
  getMetadata(): Promise<Metadata>
}
```

### Mock Adapter (`lib/data/mock-adapter.ts`)

Reads `data/simulated_data.csv` — a synthetic dataset with the same column shape as the real NLx job posting feed — and applies in-memory filtering by date, state, O*NET code, and skill. No network calls are made.

### Data Shape

Both trend and skills data resolve to `MonthlyDataPoint[]`:

```ts
interface MonthlyDataPoint {
  date: string        // "YYYY-MM-01"
  group: string       // occupation code, skill name, or "Overall"
  n_postings: number
}
```

## Chart Components

### Web (browser preview)

| Component | Location | Library |
|---|---|---|
| Trend line chart | `components/charts/TrendLineChart.tsx` | Recharts |
| Skills line chart | `components/charts/SkillsLineChart.tsx` | Recharts |
| Skills bar chart | `components/charts/SkillsBarChart.tsx` | Recharts |

Charts receive `MonthlyDataPoint[]` directly and handle their own data pivoting (date as x-axis, group as series).

### PDF (server-side)

| Component | Location | Library |
|---|---|---|
| Trend + skills line chart | `lib/pdf/pdf-chart.tsx` | @react-pdf/renderer SVG primitives |
| Skills bar chart | `lib/pdf/pdf-skills-chart.tsx` | @react-pdf/renderer SVG primitives |
| Full report document | `lib/pdf/report-document.tsx` | @react-pdf/renderer |

The PDF charts are built entirely from `<Svg>`, `<Line>`, `<Polyline>`, and `<Rect>` primitives — no external charting library. Y-axis scaling, tick generation, and polyline coordinate math all happen in TypeScript before rendering.

## PDF Generation Flow

1. Browser POSTs `{ items, reportTitle }` to `/api/pdf`
2. API route fetches all chart data in parallel (one query per report panel)
3. `buildReportDocument(chartData, onetTitles, geoLabel, reportTitle)` assembles the `<Document>` tree
4. `renderToBuffer(doc)` produces a PDF binary
5. Binary is streamed back as `application/pdf` with a `Content-Disposition: attachment` header

## Report Panel Types

Each panel in the report is one `ReportItem`:

```ts
interface ReportItem {
  id: string
  title: string
  type: 'overall' | 'by-occupation' | 'by-skill'
  startDate: string
  endDate: string
  selectedGroups: string[]   // O*NET codes (occupation) or skill labels
  majorGroup?: string        // O*NET major group (skills panels only)
  topN?: number              // top-N skills to show
  states?: string[]          // state filter (empty = all states)
}
```

## Branding

The app uses **Tailwind CSS v4** with a custom `@theme` block in `app/globals.css` registering Coleridge brand tokens:

| Token | Hex | Use |
|---|---|---|
| `brand-navy` | `#191e3f` | Header background, chart titles |
| `brand-purple` | `#4c2a9d` | Primary accent, buttons, report title |
| `brand-green` | `#05d350` | Accent rule, success states |
| `brand-darkgreen` | `#036a49` | Chart line color |
| `brand-teal` | `#1fb8ab` | Skills panel badge, secondary accent |
| `brand-crimson` | `#b81f3d` | Chart line color |
| `brand-gold` | `#b87814` | Chart line color |
| `brand-chartreuse` | `#82b814` | Chart line color |

Fonts are **Montserrat** (headings) and **Roboto** (body), self-hosted via `next/font/google`.
