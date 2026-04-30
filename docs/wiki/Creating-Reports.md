# Creating Reports

This guide walks through building and exporting a report using the NLx LMI Report Builder.

## Step 1 — Set a Report Title

At the top of the page, click the report title field (defaults to **"NLx Labor Market Report"**) and type your custom title. This title appears prominently on the exported PDF.

## Step 2 — Filter by State (Optional)

Click the **State** dropdown in the header to restrict all charts to one or more U.S. states. Leaving the selection empty means **all states** are included. The state filter applies globally to every panel in the report.

## Step 3 — Add Report Panels

Click **+ Add Trend Chart** or **+ Add Skills Chart** to add a panel.

### Trend Chart Panel

Tracks job posting volume over time.

| Setting | Description |
|---|---|
| **Title** | Label for this chart in the PDF |
| **Date range** | Start and end month (YYYY-MM format) |
| **Scope** | Overall (one line), or By Occupation (one line per O*NET code) |
| **Occupations** | If scope is "By Occupation," check one or more O*NET codes to compare |

### Skills Chart Panel

Shows how demand for specific skills has changed over time within an occupational group.

| Setting | Description |
|---|---|
| **Title** | Label for this chart in the PDF |
| **Date range** | Start and end month |
| **Major group** | O*NET major occupational group to pull skills from |
| **Top N** | How many top skills to display (e.g., top 5 or top 10) |

## Step 4 — Preview Charts

Click **Preview** on any panel to render the Recharts web chart and verify the data looks correct before exporting. You can adjust filters and re-preview as many times as needed.

## Step 5 — Export PDF

Click **Generate PDF Report** at the bottom of the page. The browser downloads a branded PDF containing all panels in the order they appear on screen.

### What the PDF includes

- Report title (in Coleridge purple)
- Navy divider line + green accent line (brand identity)
- One section per panel: chart title, date range + geography label, and the rendered line chart
- Footer: "Coleridge Initiative · Data for Impact · coleridgeinitiative.org"

## Tips

- **Panel order** matches the PDF page order. Arrange panels before exporting.
- **State filter is global** — there is no per-panel state selection. If you need charts with different geographic scope, export separate PDFs.
- **Date ranges are per-panel** — each panel can cover a different time window in the same report.
- **By-Occupation panels** display one colored line per selected O*NET code, with a legend.
- **Skills panels** display one line per skill, ranked by total posting volume.
