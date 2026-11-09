import { FileJson, FileText, Loader2, PanelLeft, ShieldAlert, ShieldCheck, WifiOff } from 'lucide-react'
import { TEMPLATES } from '../lib/sampleProject'

export default function Header({
  projectName,
  onProjectName,
  onExportPDF,
  onExportJSON,
  exporting,
  onLoadTemplate,
  onToggleSidebar,
  onTogglePanel,
  counts,
  online
}) {
  const issueCount = counts.error + counts.warning
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950 px-2 sm:gap-3 sm:px-4">
      <button onClick={onToggleSidebar} className="rounded-md p-2 text-slate-300 hover:bg-slate-800 lg:hidden" aria-label="Open equipment palette">
        <PanelLeft size={20} />
      </button>

      <div className="flex min-w-0 items-center gap-2">
        <ShieldCheck className="shrink-0 text-shield-400" size={26} />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-bold tracking-tight text-slate-100">SCADAShield</div>
          <div className="hidden text-[10px] uppercase tracking-widest text-slate-500 sm:block">Network Planner</div>
        </div>
      </div>

      <input
        value={projectName}
        onChange={(e) => onProjectName(e.target.value)}
        placeholder="Project name"
        aria-label="Project name"
        className="mx-2 hidden min-w-0 max-w-xs flex-1 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none md:block"
      />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {!online && (
          <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300" title="Working offline">
            <WifiOff size={14} />
            <span className="hidden sm:inline">Offline</span>
          </span>
        )}

        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onLoadTemplate(e.target.value)
            e.target.value = ''
          }}
          aria-label="Load template"
          className="w-24 rounded-md border border-slate-800 bg-slate-900 px-2 py-1.5 text-base text-slate-300 focus:border-sky-500 focus:outline-none sm:w-auto sm:text-xs"
        >
          <option value="" disabled>
            Templates
          </option>
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <option key={key} value={key}>
              {t.label}
            </option>
          ))}
        </select>

        <button
          onClick={onExportPDF}
          disabled={exporting}
          className="flex items-center gap-1.5 rounded-md bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60 sm:px-3"
          aria-label="Export PDF report"
        >
          {exporting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
          <span className="hidden sm:inline">PDF</span>
        </button>
        <button
          onClick={onExportJSON}
          className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 sm:px-3"
          aria-label="Export JSON report"
        >
          <FileJson size={15} />
          <span className="hidden sm:inline">JSON</span>
        </button>

        <button onClick={onTogglePanel} className="relative rounded-md p-2 text-slate-300 hover:bg-slate-800 lg:hidden" aria-label="Open security panel">
          <ShieldAlert size={20} />
          {issueCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
              {issueCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
