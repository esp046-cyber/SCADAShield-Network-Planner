import { AlertTriangle, CheckCircle2, ShieldAlert, X, Info, ChevronRight, Sliders } from 'lucide-react'
import { EQUIPMENT_BY_KIND } from '../lib/catalog'

export default function SecurityPanel({
  open,
  onClose,
  analysis,
  nodes,
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onFocusIssue
}) {
  const { counts, issues, securityLevel } = analysis

  return (
    <aside
      className={`absolute inset-y-0 right-0 z-30 flex w-80 sm:w-96 flex-col border-l border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
        open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Panel Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-shield-400" />
          <h2 className="text-sm font-semibold text-white">Security Validation</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Security Status Banner */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">IEC 62443 Status</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
              counts.errors > 0
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : counts.warnings > 0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {counts.errors > 0 ? 'Action Required' : counts.warnings > 0 ? 'Review Warnings' : 'Secure Architecture'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-center">
            <div className="text-lg font-bold text-white">{securityLevel.fr4}</div>
            <div className="text-[10px] text-slate-400">Security Level (FR 4)</div>
          </div>
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-center">
            <div className="text-lg font-bold text-white">{securityLevel.fr5}</div>
            <div className="text-[10px] text-slate-400">Security Level (FR 5)</div>
          </div>
        </div>
      </div>

      {/* Content Area: Selected Item Inspector OR Issues List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedNode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Device Inspector</h3>
              <button
                onClick={() => onDeleteNode(selectedNode.id)}
                className="text-xs font-medium text-rose-400 hover:text-rose-300"
              >
                Delete Device
              </button>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Device Name</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-shield-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">IP Address / Subnet</label>
                <input
                  type="text"
                  value={selectedNode.data.ip ?? ''}
                  onChange={(e) => onUpdateNode(selectedNode.id, { ip: e.target.value })}
                  placeholder="e.g., 10.20.0.15"
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono focus:border-shield-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : selectedEdge ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conduit Inspector</h3>
              <button
                onClick={() => onDeleteEdge(selectedEdge.id)}
                className="text-xs font-medium text-rose-400 hover:text-rose-300"
              >
                Remove Conduit
              </button>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Protocol</label>
                <select
                  value={selectedEdge.data?.protocol ?? 'opcua'}
                  onChange={(e) => onUpdateEdge(selectedEdge.id, { protocol: e.target.value })}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-shield-500 focus:outline-none"
                >
                  <option value="opcua">OPC UA (Sign & Encrypt)</option>
                  <option value="modbus">Modbus TCP (Cleartrust)</option>
                  <option value="dnp3">DNP3 Secure</option>
                  <option value="ethernetip">EtherNet/IP (CIP Security)</option>
                  <option value="https">HTTPS / TLS</option>
                  <option value="rdp">RDP / SSH</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-300">VPN / TLS Encrypted Tunnel</span>
                <input
                  type="checkbox"
                  checked={selectedEdge.data?.vpnTunnel ?? false}
                  onChange={(e) => onUpdateEdge(selectedEdge.id, { vpnTunnel: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-shield-600 focus:ring-shield-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Validation Findings ({issues.length})
            </h3>
            {issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-8 text-center">
                <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                <p className="text-xs font-medium text-slate-200">No security issues detected</p>
                <p className="text-[11px] text-slate-500 mt-1">Your network complies with IEC 62443 zones and conduits.</p>
              </div>
            ) : (
              issues.map((issue, idx) => (
                <div
                  key={idx}
                  onClick={() => onFocusIssue(issue)}
                  className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
                    issue.type === 'error'
                      ? 'border-rose-500/30 bg-rose-950/10 hover:border-rose-500/60'
                      : issue.type === 'warning'
                      ? 'border-amber-500/30 bg-amber-950/10 hover:border-amber-500/60'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {issue.type === 'error' ? (
                      <AlertTriangle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                    ) : issue.type === 'warning' ? (
                      <AlertTriangle size={15} className="shrink-0 text-amber-400 mt-0.5" />
                    ) : (
                      <Info size={15} className="shrink-0 text-sky-400 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 leading-snug">{issue.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        <strong className="text-slate-300">Fix:</strong> {issue.fix}
                      </p>
                      {issue.standard && (
                        <div className="mt-2 inline-flex items-center rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {issue.standard}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-300 transition-colors mt-1" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
