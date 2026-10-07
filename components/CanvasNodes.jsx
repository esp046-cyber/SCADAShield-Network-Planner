import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { EQUIPMENT_BY_KIND, NODE_HEIGHT, getZoneForY } from '../lib/catalog'

const RING = {
  error: 'ring-2 ring-rose-500 shadow-lg shadow-rose-500/20',
  warning: 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/20'
}

const HANDLES = [
  ['t', Position.Top],
  ['b', Position.Bottom],
  ['l', Position.Left],
  ['r', Position.Right]
]

function IndustrialNodeBase({ data, selected, yPos }) {
  const eq = EQUIPMENT_BY_KIND[data.kind]
  if (!eq) return null
  const Icon = eq.Icon
  const zone = getZoneForY(yPos + NODE_HEIGHT / 2)

  return (
    <div
      className={`w-[176px] rounded-lg border bg-slate-900 px-2.5 py-2 text-slate-100 ${
        selected ? 'border-sky-400' : 'border-slate-700'
      } ${RING[data.severity] ?? ''}`}
      style={{ minHeight: NODE_HEIGHT, borderLeft: `4px solid ${eq.color}` }}
    >
      {HANDLES.map(([id, position]) => (
        <Handle key={id} id={id} type="source" position={position} />
      ))}
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0 rounded-md p-1.5" style={{ background: `${eq.color}22`, color: eq.color }}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold leading-tight">{data.label}</div>
          <div className="truncate text-[10px] text-slate-400">{eq.label}</div>
          {data.ip ? <div className="truncate font-mono text-[10px] text-slate-500">{data.ip}</div> : null}
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span
          className="rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide"
          style={zone ? { background: `${zone.color}22`, color: zone.color } : { background: '#f43f5e22', color: '#fb7185' }}
        >
          {zone ? zone.short : 'Unzoned'}
        </span>
        {data.severity ? (
          <span className={`text-[9px] font-bold uppercase ${data.severity === 'error' ? 'text-rose-400' : 'text-amber-300'}`}>
            {data.severity}
          </span>
        ) : null}
      </div>
    </div>
  )
}
export const IndustrialNode = memo(IndustrialNodeBase)

function ZoneLaneBase({ data }) {
  const z = data.zone
  return (
    <div
      className="relative h-full w-full border-y"
      style={{ background: `${z.color}0f`, borderColor: `${z.color}33` }}
    >
      <div
        className="absolute inset-y-0 left-0 flex w-14 items-center justify-center border-r"
        style={{ background: `${z.color}1a`, borderColor: `${z.color}33` }}
      >
        <div
          className="whitespace-nowrap text-[11px] font-bold uppercase tracking-widest"
          style={{ color: z.color, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {z.label} <span className="font-medium opacity-70">/ {z.level}</span>
        </div>
      </div>
    </div>
  )
}
export const ZoneLane = memo(ZoneLaneBase)
