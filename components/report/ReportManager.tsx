'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { TrendLineChart } from '@/components/charts/TrendLineChart'
import { SkillsLineChart } from '@/components/charts/SkillsLineChart'
import type { Metadata, MonthlyDataPoint } from '@/lib/data/types'
import type { ReportItem } from '@/app/api/pdf/route'

const PANELS = [
  {
    id: 'overall',
    type: 'overall' as const,
    title: 'Overall Job Postings Trend',
    description: 'Monthly count of unique job postings across all occupations.',
    groupCategory: null as null,
  },
  {
    id: 'by-occupation',
    type: 'by-occupation' as const,
    title: 'Job Postings by Occupation',
    description:
      'Monthly postings broken out by O*NET occupation code. Select one or more codes to compare.',
    groupCategory: 'onetCodes' as 'onetCodes',
  },
  {
    id: 'by-skill',
    type: 'by-skill' as const,
    title: 'In-Demand Skills by Major Group',
    description:
      'Top skills required by job postings within an O*NET Major Group, ranked by posting count.',
    groupCategory: null as null,
  },
]

type PanelId = (typeof PANELS)[number]['id']

interface PanelState {
  startDate: string
  endDate: string
  selectedGroups: string[]
  chartData: MonthlyDataPoint[] | null
  loadingChart: boolean
  error: string | null
  included: boolean
  expanded: boolean
  majorGroup: string
  topN: number
  skillsData: MonthlyDataPoint[] | null
}

const TOP_N_OPTIONS = [1, 3, 5, 10]

function geoLabel(states: string[]): string {
  if (states.length === 0) return 'All States'
  if (states.length === 1) return states[0]
  if (states.length <= 3) return states.join(', ')
  return `${states.length} states`
}

// ---------------------------------------------------------------------------
// StateDropdown — global geographic filter (styled for dark header)
// ---------------------------------------------------------------------------
function StateDropdown({
  allStates,
  selected,
  onChange,
}: {
  allStates: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = allStates.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (state: string) =>
    onChange(
      selected.includes(state)
        ? selected.filter((s) => s !== state)
        : [...selected, state]
    )

  const label = geoLabel(selected)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-white/30 rounded-lg bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-brand-teal transition-colors min-w-[160px] shadow-sm"
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <svg
          className={`w-4 h-4 text-white/60 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => onChange([])}
              className={`flex-1 text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                selected.length === 0
                  ? 'bg-brand-purple text-white border-brand-purple'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All States
            </button>
            <button
              onClick={() => onChange([...allStates])}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Select All
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search states…"
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg mb-1 focus:outline-none focus:ring-1 focus:ring-brand-purple"
          />
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
            {filtered.map((state) => (
              <label
                key={state}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-brand-purple/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(state)}
                  onChange={() => toggle(state)}
                  style={{ accentColor: '#4c2a9d' }}
                />
                <span className="text-gray-700">{state}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400">{selected.length} selected</span>
              <button
                onClick={() => onChange([])}
                className="text-xs text-brand-purple hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MultiSelect — searchable checkbox list (used within panels)
// ---------------------------------------------------------------------------
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Search…',
  labelFn,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  labelFn?: (value: string) => string
}) {
  const [search, setSearch] = useState('')
  const filtered = options.filter((o) => {
    const label = labelFn ? labelFn(o) : o
    return (
      label.toLowerCase().includes(search.toLowerCase()) ||
      o.toLowerCase().includes(search.toLowerCase())
    )
  })

  const toggle = (opt: string) =>
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    )

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-purple"
      />
      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded bg-white divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-xs text-gray-400">No matches</p>
        ) : (
          filtered.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-brand-purple/5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                style={{ accentColor: '#4c2a9d' }}
              />
              <span className="truncate text-gray-700">
                {labelFn ? labelFn(opt) : opt}
              </span>
            </label>
          ))
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-400 px-0.5">
        <span>{selected.length} selected</span>
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="text-brand-purple hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GraphicPanel — trend line charts (overall, by-occupation)
// ---------------------------------------------------------------------------
function GraphicPanel({
  panel,
  state,
  metadata,
  globalStates,
  onStateChange,
  onPreview,
}: {
  panel: (typeof PANELS)[number]
  state: PanelState
  metadata: Metadata | null
  globalStates: string[]
  onStateChange: (id: PanelId, patch: Partial<PanelState>) => void
  onPreview: (id: PanelId) => void
}) {
  const options =
    panel.groupCategory && metadata ? metadata.categories[panel.groupCategory] : []

  const onetTitles = metadata?.onetTitles ?? {}
  const isOnetPanel = panel.groupCategory === 'onetCodes'
  const labelFn = isOnetPanel
    ? (code: string) => onetTitles[code] ?? code
    : undefined

  const scopeLabel = geoLabel(globalStates)

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-opacity ${
        state.included ? 'opacity-100' : 'opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b bg-gray-50 rounded-t-xl">
        <input
          type="checkbox"
          checked={state.included}
          onChange={(e) => onStateChange(panel.id, { included: e.target.checked })}
          style={{ accentColor: '#4c2a9d' }}
          className="w-4 h-4 cursor-pointer"
          title="Include in report"
        />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-800">{panel.title}</span>
          <p className="text-xs text-gray-500 mt-0.5">
            {panel.description}
            <span className="ml-1 text-brand-teal font-medium">· {scopeLabel}</span>
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple whitespace-nowrap">
          Line Chart
        </span>
        <button
          onClick={() => onStateChange(panel.id, { expanded: !state.expanded })}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
          title={state.expanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${state.expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {state.expanded && (
        <div className="flex gap-6 p-5">
          {/* Filters column */}
          <div className="w-56 shrink-0 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
              <input
                type="date"
                value={state.startDate}
                min={metadata?.dateRange.min}
                max={state.endDate || metadata?.dateRange.max}
                onChange={(e) =>
                  onStateChange(panel.id, { startDate: e.target.value, chartData: null })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
              <input
                type="date"
                value={state.endDate}
                min={state.startDate || metadata?.dateRange.min}
                max={metadata?.dateRange.max}
                onChange={(e) =>
                  onStateChange(panel.id, { endDate: e.target.value, chartData: null })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-purple"
              />
            </div>

            {panel.groupCategory && options.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Occupations
                  <span className="font-normal text-gray-400"> (optional)</span>
                </label>
                <MultiSelect
                  options={options}
                  selected={state.selectedGroups}
                  onChange={(v) =>
                    onStateChange(panel.id, { selectedGroups: v, chartData: null })
                  }
                  placeholder="Search occupations…"
                  labelFn={labelFn}
                />
              </div>
            )}

            <button
              onClick={() => onPreview(panel.id)}
              disabled={state.loadingChart || !state.startDate || !state.endDate}
              className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-brand-purple text-white hover:bg-[#3d2280] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.loadingChart ? 'Loading…' : 'Preview'}
            </button>

            {state.error && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}
          </div>

          {/* Chart area */}
          <div className="flex-1 min-w-0">
            <TrendLineChart
              data={state.chartData}
              loading={state.loadingChart}
              labelMap={isOnetPanel ? onetTitles : undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SkillsPanel — top-N skills line chart for a selected major group
// ---------------------------------------------------------------------------
function SkillsPanel({
  state,
  metadata,
  globalStates,
  onStateChange,
  onPreview,
}: {
  state: PanelState
  metadata: Metadata | null
  globalStates: string[]
  onStateChange: (id: PanelId, patch: Partial<PanelState>) => void
  onPreview: (id: PanelId) => void
}) {
  const panel = PANELS.find((p) => p.id === 'by-skill')!
  const majorGroups = metadata?.majorGroups ?? []
  const scopeLabel = geoLabel(globalStates)

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-opacity ${
        state.included ? 'opacity-100' : 'opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b bg-gray-50 rounded-t-xl">
        <input
          type="checkbox"
          checked={state.included}
          onChange={(e) => onStateChange('by-skill', { included: e.target.checked })}
          style={{ accentColor: '#4c2a9d' }}
          className="w-4 h-4 cursor-pointer"
          title="Include in report"
        />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-800">{panel.title}</span>
          <p className="text-xs text-gray-500 mt-0.5">
            {panel.description}
            <span className="ml-1 text-brand-teal font-medium">· {scopeLabel}</span>
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal whitespace-nowrap">
          Line Chart
        </span>
        <button
          onClick={() => onStateChange('by-skill', { expanded: !state.expanded })}
          className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
          title={state.expanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${state.expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {state.expanded && (
        <div className="flex gap-6 p-5">
          {/* Filters column */}
          <div className="w-56 shrink-0 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
              <input
                type="date"
                value={state.startDate}
                min={metadata?.dateRange.min}
                max={state.endDate || metadata?.dateRange.max}
                onChange={(e) =>
                  onStateChange('by-skill', { startDate: e.target.value, skillsData: null })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
              <input
                type="date"
                value={state.endDate}
                min={state.startDate || metadata?.dateRange.min}
                max={metadata?.dateRange.max}
                onChange={(e) =>
                  onStateChange('by-skill', { endDate: e.target.value, skillsData: null })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-purple"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Major Group</label>
              <select
                value={state.majorGroup}
                onChange={(e) =>
                  onStateChange('by-skill', { majorGroup: e.target.value, skillsData: null })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-purple bg-white"
              >
                {majorGroups.length === 0 && <option value="">Loading…</option>}
                {majorGroups.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.code} – {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Skills to show</label>
              <select
                value={state.topN}
                onChange={(e) =>
                  onStateChange('by-skill', { topN: parseInt(e.target.value, 10), skillsData: null })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-purple bg-white"
              >
                {TOP_N_OPTIONS.map((n) => (
                  <option key={n} value={n}>Top {n}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => onPreview('by-skill')}
              disabled={state.loadingChart || !state.startDate || !state.endDate || !state.majorGroup}
              className="w-full px-3 py-2 text-sm font-medium rounded-lg bg-brand-purple text-white hover:bg-[#3d2280] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.loadingChart ? 'Loading…' : 'Preview'}
            </button>

            {state.error && (
              <p className="text-xs text-red-600">{state.error}</p>
            )}
          </div>

          {/* Chart area */}
          <div className="flex-1 min-w-0">
            <SkillsLineChart data={state.skillsData} loading={state.loadingChart} />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReportManager — main export
// ---------------------------------------------------------------------------
export function ReportManager() {
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [globalStates, setGlobalStates] = useState<string[]>([])
  const [reportTitle, setReportTitle] = useState('NLx Labor Market Report')
  const [panelStates, setPanelStates] = useState<Record<PanelId, PanelState>>(
    () =>
      Object.fromEntries(
        PANELS.map((p) => [
          p.id,
          {
            startDate: '',
            endDate: '',
            selectedGroups: [],
            chartData: null,
            loadingChart: false,
            error: null,
            included: true,
            expanded: true,
            majorGroup: '',
            topN: 10,
            skillsData: null,
          },
        ])
      ) as Record<PanelId, PanelState>
  )
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfReady, setPdfReady] = useState(false)

  useEffect(() => {
    fetch('/api/metadata')
      .then((r) => r.json())
      .then((meta: Metadata) => {
        setMetadata(meta)
        const defaultMajorGroup = meta.majorGroups[0]?.code ?? ''
        setPanelStates((prev) => {
          const next = { ...prev }
          for (const id of Object.keys(next) as PanelId[]) {
            next[id] = {
              ...next[id],
              startDate: meta.dateRange.min,
              endDate: meta.dateRange.max,
              ...(id === 'by-skill' ? { majorGroup: defaultMajorGroup } : {}),
            }
          }
          return next
        })
      })
      .catch(() => setMetaError('Failed to load data. Check that the data file is in place.'))
  }, [])

  const updatePanel = useCallback(
    (id: PanelId, patch: Partial<PanelState>) =>
      setPanelStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } })),
    []
  )

  const handlePreview = useCallback(
    async (id: PanelId) => {
      const panel = PANELS.find((p) => p.id === id)!
      const st = panelStates[id]

      if (panel.type === 'by-skill') {
        updatePanel(id, { loadingChart: true, error: null })
        const params = new URLSearchParams({
          majorGroup: st.majorGroup,
          topN: String(st.topN),
          startDate: st.startDate,
          endDate: st.endDate,
        })
        globalStates.forEach((s) => params.append('state', s))
        try {
          const res = await fetch(`/api/skills-data?${params}`)
          if (!res.ok) throw new Error(await res.text())
          const data: MonthlyDataPoint[] = await res.json()
          updatePanel(id, { skillsData: data, loadingChart: false })
        } catch (e) {
          updatePanel(id, {
            loadingChart: false,
            error: e instanceof Error ? e.message : 'Failed to load skills data.',
          })
        }
        return
      }

      updatePanel(id, { loadingChart: true, error: null })

      const params = new URLSearchParams({
        startDate: st.startDate,
        endDate: st.endDate,
      })
      globalStates.forEach((s) => params.append('state', s))
      if (panel.type === 'by-occupation') {
        st.selectedGroups.forEach((g) => params.append('onetCode', g))
      }

      try {
        const res = await fetch(`/api/chart-data?${params}`)
        if (!res.ok) throw new Error(await res.text())
        const data: MonthlyDataPoint[] = await res.json()
        updatePanel(id, { chartData: data, loadingChart: false })
      } catch (e) {
        updatePanel(id, {
          loadingChart: false,
          error: e instanceof Error ? e.message : 'Failed to load chart data.',
        })
      }
    },
    [panelStates, globalStates, updatePanel]
  )

  const handleGeneratePdf = async () => {
    const included = PANELS.filter((p) => panelStates[p.id].included)
    if (included.length === 0) {
      setPdfError('Select at least one graphic to include in the report.')
      return
    }

    setPdfLoading(true)
    setPdfError(null)
    setPdfReady(false)

    const items: ReportItem[] = included.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      startDate: panelStates[p.id].startDate,
      endDate: panelStates[p.id].endDate,
      selectedGroups: panelStates[p.id].selectedGroups,
      majorGroup: panelStates[p.id].majorGroup,
      topN: panelStates[p.id].topN,
      states: globalStates.length ? globalStates : undefined,
    }))

    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, reportTitle }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'PDF generation failed.')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nlx-report-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      setPdfReady(true)
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'PDF generation failed.')
    } finally {
      setPdfLoading(false)
    }
  }

  const includedCount = PANELS.filter((p) => panelStates[p.id].included).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar — Coleridge dark navy */}
      <header className="bg-brand-navy shadow-md">
        {/* Green accent line (mirrors brand logo underline) */}
        <div className="h-0.5 bg-brand-green" />

        <div className="flex items-center justify-between gap-6 px-6 py-4">
          {/* Branding */}
          <div className="shrink-0">
            <h1 className="font-heading text-xl font-bold text-white tracking-wide">
              NLx Report Builder
            </h1>
            <p className="text-xs text-white/50 mt-0.5 font-heading">
              Coleridge Initiative · Data for Impact
            </p>
          </div>

          {/* Report title + geographic filter */}
          <div className="flex items-center gap-5 flex-1 justify-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-white/60 whitespace-nowrap">
                Report title:
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title…"
                className="px-3 py-1.5 text-sm border border-white/25 rounded-lg bg-white/10 text-white placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-brand-teal min-w-[220px] transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/60 whitespace-nowrap">
                Geographic scope:
              </span>
              <StateDropdown
                allStates={metadata?.categories.states ?? []}
                selected={globalStates}
                onChange={(v) => {
                  setGlobalStates(v)
                  setPanelStates((prev) => {
                    const next = { ...prev }
                    for (const id of Object.keys(next) as PanelId[]) {
                      next[id] = { ...next[id], chartData: null, skillsData: null }
                    }
                    return next
                  })
                }}
              />
            </div>
          </div>

          {/* Status + generate button */}
          <div className="flex items-center gap-3 shrink-0">
            {pdfReady && (
              <span className="text-sm text-brand-green font-medium">
                ✓ Report downloaded
              </span>
            )}
            {pdfError && (
              <span className="text-sm text-red-400">{pdfError}</span>
            )}
            <button
              onClick={handleGeneratePdf}
              disabled={pdfLoading || !metadata || includedCount === 0}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-purple text-white hover:bg-[#3d2280] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {pdfLoading
                ? 'Generating…'
                : `Generate Report (${includedCount} graphic${includedCount !== 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        {metaError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {metaError}
          </div>
        )}

        {!metadata && !metaError && (
          <div className="text-center py-12 text-gray-400 text-sm animate-pulse">
            Loading data…
          </div>
        )}

        {metadata &&
          PANELS.map((panel) =>
            panel.type === 'by-skill' ? (
              <SkillsPanel
                key={panel.id}
                state={panelStates[panel.id]}
                metadata={metadata}
                globalStates={globalStates}
                onStateChange={updatePanel}
                onPreview={handlePreview}
              />
            ) : (
              <GraphicPanel
                key={panel.id}
                panel={panel}
                state={panelStates[panel.id]}
                metadata={metadata}
                globalStates={globalStates}
                onStateChange={updatePanel}
                onPreview={handlePreview}
              />
            )
          )}

        {metadata && (
          <p className="text-xs text-gray-400 text-center pt-2">
            Check the checkbox on each panel to include it in the report. Uncheck to exclude.
          </p>
        )}
      </main>
    </div>
  )
}
