import { ShieldCheck, Download, Menu, FileText, Code2, Wifi, WifiOff } from 'lucide-react'
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
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 shadow-md select-none">
      {/* Left: Brand & Sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors lg:hidden"
          title="Toggle Equipment Catalog"
        >
          <Menu size={16} />
          <span>Elements</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-shield-600/20 border border-shield-500/30 text-shield-400">
            <ShieldCheck size={20} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">SCADAShield</h1>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Network Planner</p>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Project Name Input */}
        <div className="relative flex items-center max-w-[220px] sm:max-w-xs">
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectName(e.target.value)}
            placeholder="Project name..."
            className="w-full rounded-md border border-slate-700/80 bg-slate-950/60 px-2.5 py-1 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-shield-500 focus:outline-none focus:ring-1 focus:ring-shield-500 truncate"
          />
        </div>
      </div>

      {/* Right: Templates, Validation badge & Exports */}
      <div className="flex items-center gap-2.5">
        {/* Online / Offline Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded bg-slate-950/40 border border-slate-800 text-slate-400">
          {online ? (
            <>
              <Wifi size={13} className="text-emerald-400" />
              <span className="text-slate-300">Online</span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="text-amber-400" />
              <span className="text-slate-300">Offline Mode</span>
            </>
          )}
        </div>

        {/* Template Selector */}
        <div className="relative">
          <select
            onChange={(e) => onLoadTemplate(e.target.value)}
            defaultValue=""
            className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-shield-500 cursor-pointer"
          >
            <option value="" disabled>
              Templates...
            </option>
            {Object.entries(TEMPLATES).map(([k, t]) => (
              <option key={k} value={k} className="bg-slate-900 text-slate-200">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2.5">
          <button
            onClick={onExportPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-md bg-shield-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-shield-500 disabled:opacity-50 transition-all"
            title="Export PDF Report"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={onExportJSON}
            className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
            title="Export JSON Configuration"
          >
            <Code2 size={14} />
            <span className="hidden sm:inline">JSON</span>
          </button>
        </div>

        {/* Mobile Security Panel Toggle Button */}
        <button
          onClick={onTogglePanel}
          className="relative flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 lg:hidden"
        >
          <span>Security</span>
          {counts.errors > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
              {counts.errors}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
