// ---------------------------------------------------------------------------
// MockAdapter — reads from a local CSV file and expands it to a large
// simulated dataset for realistic chart output.
//
// Environment variable DATA_CSV_PATH overrides the default path.
// Default: <project root>/data/simulated_data.csv
//
// CSV must have these columns (header row required):
//   job_id, date_compiled, country, state, city, onet_code
//
// To swap in a real data source, implement DataAdapter in a new file and
// replace the import of getMockAdapter() in each API route.
// ---------------------------------------------------------------------------

import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import type { DataAdapter } from './adapter'
import type { JobPosting, MonthlyDataPoint, PostingFilters, Metadata, SkillsFilters } from './types'
import { ONET_TITLES } from './onet-titles'
import { ONET_MAJOR_GROUPS } from './onet-major-groups'
import { getOnetSkills } from './onet-skills'

// Total simulated postings to represent. The seed CSV is small; the expansion
// loop runs this many iterations but only stores pre-aggregated bucket counts,
// so memory stays manageable (~300 MB instead of ~1.2 GB for 10 M raw objects).
const TARGET_POSTINGS = 10_000_000

// Relative demand weight by O*NET major group (2-digit prefix).
// Higher = more job postings for that group in the simulated data.
const MAJOR_GROUP_WEIGHTS: Record<string, number> = {
  '11': 1.3,  // Management
  '13': 1.0,  // Business/Financial Operations
  '15': 1.4,  // Computer/Mathematical
  '17': 0.7,  // Architecture/Engineering
  '19': 0.4,  // Life/Physical/Social Science
  '21': 0.5,  // Community/Social Service
  '23': 0.3,  // Legal
  '25': 0.8,  // Education/Training
  '27': 0.5,  // Arts/Design/Entertainment
  '29': 1.5,  // Healthcare Practitioners
  '31': 1.1,  // Healthcare Support
  '33': 0.6,  // Protective Service
  '35': 1.2,  // Food Prep/Serving
  '37': 0.7,  // Building/Grounds Cleaning
  '39': 0.7,  // Personal Care/Service
  '41': 1.8,  // Sales/Related
  '43': 2.0,  // Office/Admin Support
  '45': 0.3,  // Farming/Fishing/Forestry
  '47': 1.0,  // Construction/Extraction
  '49': 1.0,  // Installation/Maintenance/Repair
  '51': 0.9,  // Production
  '53': 1.5,  // Transportation/Material Moving
}

// Seasonal multiplier by major group and month index (0 = Jan, 11 = Dec).
// Each row averages close to 1.0 so group weights stay meaningful.
const SEASONAL_PATTERNS: Record<string, number[]> = {
  // Construction/Extraction + Building/Grounds: summer peak, winter dip
  '47': [0.70, 0.75, 0.90, 1.05, 1.15, 1.25, 1.25, 1.20, 1.10, 0.95, 0.80, 0.70],
  '37': [0.72, 0.76, 0.88, 1.04, 1.14, 1.24, 1.24, 1.18, 1.08, 0.96, 0.82, 0.72],
  // Farming/Fishing/Forestry: spring–summer peak
  '45': [0.50, 0.55, 0.80, 1.15, 1.35, 1.30, 1.20, 1.05, 0.85, 0.65, 0.55, 0.50],
  // Sales/Retail: November–December holiday spike
  '41': [0.86, 0.82, 0.90, 0.95, 0.97, 0.98, 0.98, 0.98, 1.00, 1.05, 1.25, 1.45],
  // Food Prep/Serving + Personal Care: summer leisure peak
  '35': [0.85, 0.85, 0.90, 0.95, 1.05, 1.20, 1.25, 1.20, 1.00, 0.90, 0.88, 0.87],
  '39': [0.86, 0.86, 0.90, 0.95, 1.05, 1.18, 1.22, 1.18, 1.00, 0.90, 0.88, 0.87],
  // Education: back-to-school hiring spike Aug–Sep, summer lull
  '25': [0.75, 0.70, 0.80, 0.88, 0.95, 0.78, 0.65, 1.40, 1.45, 1.00, 0.90, 0.75],
  // Computer/Math: Q1 budget flush, mild summer slowdown
  '15': [1.12, 1.08, 1.05, 1.02, 0.98, 0.95, 0.88, 0.92, 1.00, 1.02, 1.02, 0.95],
  // Healthcare Practitioners + Support: winter uptick (flu season, year-end)
  '29': [1.08, 1.02, 0.98, 0.95, 0.93, 0.93, 0.95, 0.98, 1.00, 1.02, 1.06, 1.10],
  '31': [1.07, 1.02, 0.98, 0.95, 0.94, 0.93, 0.95, 0.98, 1.00, 1.02, 1.06, 1.10],
  // Business/Financial: Q1 tax season + Q4 year-end planning
  '13': [1.18, 1.22, 1.15, 1.05, 0.90, 0.88, 0.88, 0.90, 0.95, 1.00, 1.05, 1.12],
  // Transportation: Q4 holiday shipping surge
  '53': [0.88, 0.88, 0.92, 0.95, 0.98, 0.98, 1.00, 1.00, 1.02, 1.08, 1.22, 1.35],
  // Management: slight Q1 annual-planning bump
  '11': [1.08, 1.05, 1.02, 1.00, 0.98, 0.95, 0.92, 0.92, 0.98, 1.02, 1.02, 1.00],
  // Legal: Q1–Q2 slight uptick, summer lull
  '23': [1.10, 1.08, 1.05, 1.05, 1.02, 0.98, 0.90, 0.90, 0.95, 1.00, 1.00, 0.97],
}

function getSeasonalMultiplier(majorGroup: string, monthIdx: number): number {
  return SEASONAL_PATTERNS[majorGroup]?.[monthIdx] ?? 1.0
}

// Pre-aggregated posting count per (state, onetCode, month) combination.
interface AggRow {
  state: string
  onetCode: string
  month: string  // "YYYY-MM-01"
  count: number
}

interface LoadedData {
  agg: AggRow[]
  states: string[]
  cities: string[]
  onetCodes: string[]
  dateRange: { min: string; max: string }
}

let _cache: LoadedData | null = null

function toMonthKey(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

// Expand seed rows to TARGET_POSTINGS and aggregate into (state, onetCode, month)
// buckets in a single pass — avoids materialising 10 M raw objects in memory.
function buildAggregated(seeds: JobPosting[]): LoadedData {
  const validDates = seeds
    .map((r) => new Date(r.date_compiled).getTime())
    .filter((t) => !isNaN(t))
  const minTs = Math.min(...validDates)
  const maxTs = Math.max(...validDates)
  const minDate = new Date(minTs)
  const maxDate = new Date(maxTs)

  // Enumerate all months in range
  const months: string[] = []
  const cursor = new Date(Date.UTC(minDate.getUTCFullYear(), minDate.getUTCMonth(), 1))
  const last   = new Date(Date.UTC(maxDate.getUTCFullYear(), maxDate.getUTCMonth(), 1))
  while (cursor <= last) {
    const y = cursor.getUTCFullYear()
    const m = String(cursor.getUTCMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}-01`)
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  const buckets = new Map<string, number>()

  // 1. Count each original seed row in its actual month.
  for (const seed of seeds) {
    const month = toMonthKey(seed.date_compiled)
    if (!month || !seed.state || !seed.onet_code) continue
    const key = `${seed.state}|${seed.onet_code}|${month}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  // 2. Expand to TARGET_POSTINGS synthetic rows and accumulate counts directly.
  //    Each synthetic row follows the same round-robin seed selection as the
  //    old expandSeedRows so the state/occupation distribution is preserved.
  const targetSynthetic = TARGET_POSTINGS - seeds.length
  const rowsPerMonth = Math.ceil(targetSynthetic / months.length)

  for (let m = 0; m < months.length; m++) {
    const month    = months[m]
    const monthIdx = parseInt(month.slice(5, 7)) - 1  // 0-11
    const limit    = Math.min(rowsPerMonth, targetSynthetic - m * rowsPerMonth)
    if (limit <= 0) break
    for (let o = 0; o < limit; o++) {
      const seed       = seeds[(m * rowsPerMonth + o) % seeds.length]
      const majorGroup = seed.onet_code.slice(0, 2)
      const weight     = (MAJOR_GROUP_WEIGHTS[majorGroup] ?? 1.0) * getSeasonalMultiplier(majorGroup, monthIdx)
      const key        = `${seed.state}|${seed.onet_code}|${month}`
      buckets.set(key, (buckets.get(key) ?? 0) + weight)
    }
  }

  // 3. Convert bucket map to AggRow array (round weighted floats to integers).
  const agg: AggRow[] = []
  for (const [key, count] of buckets) {
    const first  = key.indexOf('|')
    const second = key.indexOf('|', first + 1)
    agg.push({
      state:    key.slice(0, first),
      onetCode: key.slice(first + 1, second),
      month:    key.slice(second + 1),
      count:    Math.round(count),
    })
  }

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  return {
    agg,
    states:    [...new Set(seeds.map((r) => r.state).filter(Boolean))].sort(),
    cities:    [...new Set(seeds.map((r) => r.city).filter(Boolean))].sort(),
    onetCodes: [...new Set(seeds.map((r) => r.onet_code).filter(Boolean))].sort(),
    dateRange: { min: fmt(minDate), max: fmt(maxDate) },
  }
}

function loadData(): LoadedData {
  if (_cache) return _cache

  const defaultCsvPath = path.join(process.cwd(), 'data', 'simulated_data.csv')
  const csvPath = process.env.DATA_CSV_PATH ?? defaultCsvPath

  const content = fs.readFileSync(csvPath, 'utf-8')
  const result  = Papa.parse<JobPosting>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })
  const seeds = result.data.filter((r) => r.job_id && r.date_compiled)

  _cache = buildAggregated(seeds)
  return _cache
}

// ---------------------------------------------------------------------------
// Query helpers that operate on AggRow[] instead of raw JobPosting[].
// Month-range comparison uses "YYYY-MM" string ordering (lexicographic = correct).
// ---------------------------------------------------------------------------

function queryMonthly(
  agg: AggRow[],
  filters: PostingFilters
): MonthlyDataPoint[] {
  const startMon = filters.startDate.slice(0, 7)
  const endMon   = filters.endDate.slice(0, 7)
  const stateSet = filters.states?.length    ? new Set(filters.states)    : null
  const onetSet  = filters.onetCodes?.length ? new Set(filters.onetCodes) : null

  const buckets = new Map<string, number>()

  for (const row of agg) {
    const rowMon = row.month.slice(0, 7)
    if (rowMon < startMon || rowMon > endMon) continue
    if (stateSet && !stateSet.has(row.state)) continue

    let group: string
    if (onetSet) {
      if (!onetSet.has(row.onetCode)) continue
      group = row.onetCode
    } else {
      group = 'Overall'
    }

    const key = `${row.month}|${group}`
    buckets.set(key, (buckets.get(key) ?? 0) + row.count)
  }

  const result: MonthlyDataPoint[] = []
  for (const [key, n_postings] of buckets) {
    const pipe = key.indexOf('|')
    result.push({ date: key.slice(0, pipe), n_postings, group: key.slice(pipe + 1) })
  }
  result.sort((a, b) => a.date.localeCompare(b.date) || a.group.localeCompare(b.group))
  return result
}

function querySkills(agg: AggRow[], filters: SkillsFilters): MonthlyDataPoint[] {
  const startMon = filters.startDate.slice(0, 7)
  const endMon   = filters.endDate.slice(0, 7)
  const prefix   = filters.majorGroup + '-'
  const stateSet = filters.states?.length ? new Set(filters.states) : null

  // Single pass: accumulate both monthly buckets and skill totals
  const monthlyBuckets = new Map<string, number>() // "YYYY-MM-01|skill" → count
  const skillTotals    = new Map<string, number>()  // skill → total count

  for (const row of agg) {
    const rowMon = row.month.slice(0, 7)
    if (rowMon < startMon || rowMon > endMon) continue
    if (stateSet && !stateSet.has(row.state)) continue
    if (!row.onetCode.startsWith(prefix)) continue

    for (const skill of getOnetSkills(row.onetCode)) {
      const key = `${row.month}|${skill}`
      monthlyBuckets.set(key, (monthlyBuckets.get(key) ?? 0) + row.count)
      skillTotals.set(skill, (skillTotals.get(skill) ?? 0) + row.count)
    }
  }

  // Determine top-N skills by total count
  const topSkills = new Set(
    [...skillTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, filters.topN)
      .map(([skill]) => skill)
  )

  // Build monthly time-series for top-N skills only
  const result: MonthlyDataPoint[] = []
  for (const [key, n_postings] of monthlyBuckets) {
    const pipe  = key.indexOf('|')
    const skill = key.slice(pipe + 1)
    if (!topSkills.has(skill)) continue
    result.push({ date: key.slice(0, pipe), n_postings, group: skill })
  }
  result.sort((a, b) => a.date.localeCompare(b.date) || a.group.localeCompare(b.group))
  return result
}

// ---------------------------------------------------------------------------
// Public adapter
// ---------------------------------------------------------------------------

export function getMockAdapter(): DataAdapter {
  return {
    async getMetadata(): Promise<Metadata> {
      const { states, cities, onetCodes, dateRange } = loadData()

      const onetTitles: Record<string, string> = {}
      for (const code of onetCodes) {
        if (ONET_TITLES[code]) onetTitles[code] = ONET_TITLES[code]
      }

      const presentGroupCodes = [...new Set(onetCodes.map((c) => c.slice(0, 2)))].sort()
      const majorGroups = presentGroupCodes
        .filter((c) => ONET_MAJOR_GROUPS[c])
        .map((c) => ({ code: c, name: ONET_MAJOR_GROUPS[c] }))

      return {
        categories: { states, cities, onetCodes },
        dateRange,
        onetTitles,
        majorGroups,
      }
    },

    async getMonthlyPostings(filters: PostingFilters): Promise<MonthlyDataPoint[]> {
      const { agg } = loadData()
      return queryMonthly(agg, filters)
    },

    async getSkillsData(filters: SkillsFilters): Promise<MonthlyDataPoint[]> {
      const { agg } = loadData()
      return querySkills(agg, filters)
    },
  }
}
