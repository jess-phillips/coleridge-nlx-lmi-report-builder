# NLx LMI Report Builder — Wiki

Welcome to the documentation for the **NLx Labor Market Intelligence Report Builder**, a tool developed by the [Coleridge Initiative](https://coleridgeinitiative.org) for composing and exporting branded labor market reports from NLx job posting data.

## Pages

| Page | Description |
|---|---|
| [How the Tool Works](How-the-Tool-Works) | Architecture, data flow, and component overview |
| [Creating Reports](Creating-Reports) | Step-by-step guide for end users |
| [NLx API Integration Roadmap](NLx-API-Integration-Roadmap) | Plan for replacing mock data with live NLx API calls |

## About This Tool

The Report Builder allows Coleridge analysts and partners to:

- Compose multi-panel reports mixing **job posting trend charts** and **in-demand skills charts**
- Filter by **date range** and **U.S. state(s)**
- Set a **custom report title** for each export
- Download a single branded **PDF** ready for presentation or publication

The prototype currently runs against **simulated data** that mirrors the structure of the real NLx API. Swapping in the live API requires changes only in the data adapter layer — no UI or PDF changes are needed.

## Repository

[github.com/jess-phillips/coleridge-nlx-lmi-report-builder](https://github.com/jess-phillips/coleridge-nlx-lmi-report-builder)
