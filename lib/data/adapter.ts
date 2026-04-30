// ---------------------------------------------------------------------------
// DataAdapter interface — the contract every data source must satisfy.
//
// To connect your own data source (database, API, different CSV schema, etc.):
//   1. Create a new file implementing DataAdapter (e.g. lib/data/my-adapter.ts)
//   2. Replace the import in each API route with your implementation
//   3. No other files need to change
// ---------------------------------------------------------------------------

import type { MonthlyDataPoint, PostingFilters, Metadata, SkillsFilters } from './types'

export interface DataAdapter {
  /** Returns category option lists and the overall date range for the UI. */
  getMetadata(): Promise<Metadata>

  /**
   * Returns monthly job-posting counts, optionally broken out by state or
   * O*NET occupation code according to the provided filters.
   */
  getMonthlyPostings(filters: PostingFilters): Promise<MonthlyDataPoint[]>

  /**
   * Returns monthly posting counts per skill for the top-N skills in a given
   * O*NET major group. Each MonthlyDataPoint has group = skill name.
   */
  getSkillsData(filters: SkillsFilters): Promise<MonthlyDataPoint[]>
}
