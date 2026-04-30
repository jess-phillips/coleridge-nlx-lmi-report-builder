# NLx LMI Report Builder

A Next.js web application for building and exporting branded **Labor Market Intelligence (LMI) reports** from [NLx](https://nationallaborexchange.org) job posting data, developed by the [Coleridge Initiative](https://coleridgeinitiative.org).

## Overview

The tool lets analysts compose multi-panel PDF reports combining:
- **Trend charts** — overall job postings over time or broken out by occupation (O*NET code)
- **Skills charts** — top in-demand skills within a major occupational group over time

Reports are filtered by date range and U.S. state, titled with a custom label, and exported as a single branded PDF.

## Current Status

This is a **prototype** running against simulated data. The mock data layer mirrors the shape of the real NLx API so that the integration swap will be a drop-in change. See [docs/wiki/NLx-API-Integration-Roadmap.md](docs/wiki/NLx-API-Integration-Roadmap.md) for the migration plan.

## Quick Start

### Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

### Docker

```bash
docker compose up --build
# → http://localhost:3000
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 |
| Charts (web) | Recharts |
| PDF generation | @react-pdf/renderer (server-side, Node.js runtime) |
| Fonts | Montserrat + Roboto via next/font/google |
| Data (prototype) | Simulated CSV via mock adapter |

## Repository Structure

```
app/
  api/            # API routes (chart-data, skills-data, pdf, metadata)
  page.tsx        # Root page — mounts ReportManager
  layout.tsx      # Font injection, global styles
components/
  charts/         # Recharts line/bar chart components
  report/         # ReportManager — the main UI shell
lib/
  data/           # Adapter interface + mock adapter + O*NET reference data
  pdf/            # react-pdf chart and document components
data/
  simulated_data.csv   # Synthetic NLx-shaped job posting data
docs/
  wiki/           # Wiki source pages (see GitHub Wiki for rendered version)
```

## Wiki

Full documentation is in the [GitHub Wiki](../../wiki):

- **[Home](../../wiki/Home)** — Project overview and navigation
- **[How the Tool Works](../../wiki/How-the-Tool-Works)** — Architecture and data flow
- **[Creating Reports](../../wiki/Creating-Reports)** — End-user guide
- **[NLx API Integration Roadmap](../../wiki/NLx-API-Integration-Roadmap)** — Plan for connecting to live NLx data

---

Coleridge Initiative · Data for Impact · [coleridgeinitiative.org](https://coleridgeinitiative.org)
