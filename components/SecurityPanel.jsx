import { useMemo, useState } from 'react'
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, MousePointerClick, Trash2, X } from 'lucide-react'
import { EQUIPMENT_BY_KIND, PROTOCOLS, PROTOCOL_LIST, ZONE_BY_ID } from '../lib/catalog'

const SEV = {
  error: { Icon: AlertOctagon, label: 'Error', cls: 'border-rose-500/30 bg-rose-500/5', text: 'text-rose-300' },
  warning: { Icon: AlertTriangle, label: 'Warning', cls: 'border-amber-500/30 bg-amber-500/5', text: 'text-amber-300' },
  info: { Icon: Info, label: 'Note', cls: 'border-sky-500/30 bg-sky-500/5', text: 'text-sky-300' }
}

const STATUS = {
  pass: 'text-emerald-300 bg-emerald-500/10',
  attention: 'text-amber-300 bg-amber-500/10',
  fail: 'text-rose-300 bg-rose-500/10',
  'n/a': 'text-slate-400 bg-slate-500/10'
}

const inputCls =
  'w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-base text-slate-100 focus:border-sky-500 focus:outline-none sm:text-sm'

function ScoreRing({ score }) {
  const r = 34
  const c = 2 * Math.PI * r
  const pct = score == null ? 0 : score / 100
  const color = score == null ? '#475569' : score >= 85 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e'
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset 300ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-100">{score == null ? '--' : score}</span>
        <span className="text-[9px] uppercase tracking-wider text-slate-500">score</span>
      </div>
    </div>
  )
}

function NodeInspector({ node, zoneId, onUpdate, onDelete }) {
  const eq = EQUIPMENT_BY_KIND[node.data.kind]
  const zone = zoneId ? ZONE_BY_ID[zoneId] : null
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-300">{eq?.label}</div>
        <span className="text-[10px] font-semibold uppercase" style={{ color: zone?.color ?? '#fb7185' }}>
          {zone ? zone.label : 'Unzoned'}
        </span>
      </div>
      <label className="block text-[11px] text-slate-500">
        Name
        <input className={inputCls} value={node.data.label} onChange={(e) => onUpdate(node.id, { label: e.target.value })} />
      </label>
      <label className="block text-[11px] text-slate-500">
        IP / VLAN
        <input className={inputCls} value={node.data.ip ?? ''} onChange={(e) => onUpdate(node.id, { ip: e.target.value })} placeholder="10.0.0.1 / VLAN 30" />
      </label>
      <button onClick={() => onDelete(node.id)} className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300">
        <Trash2 size={14} /> Remove device
      </button>
    </div>
  )
}

function EdgeInspector({ edge, labelOf, onUpdate, onDelete }) {
  const proto = PROTOCOLS[edge.data?.protocol] ?? PROTOCOLS.opcua
  const tunnel = !!edge.data?.vpnTunnel
  const enc = proto.encrypted || tunnel
  return (
    <div className="space-y-2.5">
      <div className="text-xs font-semibold text-slate-300">
        {labelOf(edge.source)} <span className="text-slate-600">&harr;</span> {labelOf(edge.target)}
      </div>
      <label className="block text-[11px] text-slate-500">
        Protocol
        <select className={inputCls} value={proto.id} onChange={(e) => onUpdate(edge.id, { protocol: e.target.value })}>
          <optgroup label="Encrypted / authenticated">
            {PROTOCOL_LIST.filter((p) => p.encrypted).map((p) => (
              <option key={p.id} value={p.id}>{p.label} (port {p.port})</option>
            ))}
          </optgroup>
          <optgroup label="Cleartext / legacy">
            {PROTOCOL_LIST.filter((p) => !p.encrypted).map((p) => (
              <option key={p.id} value={p.id}>{p.label} (port {p.port})</option>
            ))}
          </optgroup>
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" className="h-4 w-4 accent-sky-500" checked={tunnel} onChange={(e) => onUpdate(edge.id, { vpnTunnel: e.target.checked })} />
        Wrapped in IPsec / TLS VPN tunnel
      </label>
      <div className={`text-[11px] font-medium ${enc ? 'text-emerald-400' : 'text-amber-300'}`}>
        {enc ? 'Traffic is encrypted' : 'Traffic is cleartext'}
      </div>
      <button onClick={() => onDelete(edge.id)} className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300">
        <Trash2 size={14} /> Remove connection
      </button>
    </div>
  )
}

export default function SecurityPanel({
  open, onClose, analysis, nodes, selectedNode, selectedEdge,
  onUpdateNode, onUpdateEdge, onDeleteNode, onDeleteEdge, onFocusIssue
}) {
  const [filter, setFilter] = useState('all')
  const labelOf = (id) => nodes.find((n) => n.id === id)?.data?.label ?? id

  const visible = useMemo(
    () => (filter === 'all' ? analysis.issues : analysis.issues.filter((i) => i.severity === filter)),
    [analysis.issues, filter]
  )

  const tabs = [
    ['all', `All ${analysis.issues.length}`],
    ['error', `Errors ${analysis.counts.error}`],
    ['warning', `Warnings ${analysis.counts.warning}`],
    ['info', `Notes ${analysis.counts.info}`]
  ]

  return (
    <aside
      className={`absolute inset-y-0 right-0 z-30 flex w-96 max-w-[92vw] flex-col border-l border-slate-800 bg-slate-950 transition-transform duration-200 lg:static lg:z-auto lg:max-w-none lg:translate-x-0 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-label="Security validation"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">Security validation</h2>
        <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden" aria-label="Close security panel">
          <X size={18} />
        </button>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto">
        {/* Score */}
        <div className="flex items-center gap-4 border-b border-slate-800 p-4">
          <ScoreRing score={analysis.score} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-100">{analysis.verdict}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              {analysis.deviceCount} devices, {analysis.linkStats.total} conduits, {analysis.linkStats.cleartext} cleartext
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {analysis.frStatus.map((f) => (
                <span key={f.fr} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS[f.status]}`} title={f.name}>
                  {f.fr.replace('FR', 'FR ')}: {f.status}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="border-b border-slate-800 p-4">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Inspector</h3>
          {selectedNode ? (
            <NodeInspector node={selectedNode} zoneId={analysis.zoneByNode[selectedNode.id]} onUpdate={onUpdateNode} onDelete={onDeleteNode} />
          ) : selectedEdge ? (
            <EdgeInspector edge={selectedEdge} labelOf={labelOf} onUpdate={onUpdateEdge} onDelete={onDeleteEdge} />
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MousePointerClick size={15} /> Select a device or connection to edit it.
            </div>
          )}
        </div>

        {/* Findings */}
        <div className="p-4">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  filter === key ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {analysis.deviceCount === 0 ? (
            <p className="text-xs text-slate-500">Add equipment to the canvas to start live validation.</p>
          ) : visible.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-300">
              <CheckCircle2 size={16} /> Nothing to report in this category.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {visible.map((i) => {
                const s = SEV[i.severity]
                return (
                  <li key={i.id}>
                    <button onClick={() => onFocusIssue(i)} className={`w-full rounded-lg border p-3 text-left hover:brightness-125 ${s.cls}`}>
                      <div className={`flex items-start gap-2 text-xs font-semibold ${s.text}`}>
                        <s.Icon size={15} className="mt-px shrink-0" />
                        <span>
                          {s.label}: {i.title}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{i.message}</p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                        <span className="font-semibold text-slate-400">Fix:</span> {i.remediation}
                      </p>
                      <div className="mt-2 text-[10px] font-medium text-slate-600">
                        {i.fr.replace('FR', 'FR ')} / {i.ref}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
