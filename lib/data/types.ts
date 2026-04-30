// ---------------------------------------------------------------------------
// Core data types shared across the data adapter, API routes, and components.
// ---------------------------------------------------------------------------

export interface MonthlyDataPoint {
  /** ISO date string for the first day of the month, e.g. "2022-03-01" */
  date: string
  n_postings: number
  /** Series label: "Overall", a state name, or an O*NET code */
  group: string
}

export interface PostingFilters {
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  /** Filter to specific states (full names). Applied before grouping — never used as the group key. */
  states?: string[]
  /** Filter to specific O*NET codes and group results by occupation. */
  onetCodes?: string[]
}

export interface Categories {
  states: string[]
  cities: string[]
  onetCodes: string[]
}

export interface DateRange {
  min: string  // YYYY-MM-DD
  max: string  // YYYY-MM-DD
}

export interface MajorGroup {
  code: string
  name: string
}

export interface Metadata {
  categories: Categories
  dateRange: DateRange
  /** Maps O*NET code → occupation title for display purposes */
  onetTitles: Record<string, string>
  /** Major groups present in the dataset, sorted by code */
  majorGroups: MajorGroup[]
}

export interface SkillCount {
  skill: string
  count: number
}

export interface SkillsFilters {
  startDate: string
  endDate: string
  majorGroup: string
  topN: number
  states?: string[]
}

// Shape of a single row in the source CSV / database record.
// Swap this out if your real data has different column names.
export interface JobPosting {
  job_id: string
  date_compiled: string
  country: string
  state: string
  city: string
  onet_code: string
}
