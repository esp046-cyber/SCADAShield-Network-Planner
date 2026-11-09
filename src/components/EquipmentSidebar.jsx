import { Plus, X } from 'lucide-react'
import { DND_MIME, EQUIPMENT, EQUIPMENT_GROUPS, ZONES } from '../lib/catalog'

export default function EquipmentSidebar({ open, onClose, onAdd }) {
  const onDragStart = (e, kind) => {
    e.dataTransfer.setData(DND_MIME, kind)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside
      className={`absolute inset-y-0 left-0 z-30 flex w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Equipment palette"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Equipment</h2>
          <p className="text-[11px] text-slate-500">Drag onto a swimlane, or tap +</p>
        </div>
        <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden" aria-label="Close palette">
          <X size={18} />
        </button>
      </div>

      <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-3">
        {EQUIPMENT_GROUPS.map((group) => (
          <section key={group}>
            <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">{group}</h3>
            <ul className="space-y-2">
              {EQUIPMENT.filter((e) => e.group === group).map((eq) => {
                const Icon = eq.Icon
                return (
                  <li
                    key={eq.kind}
                    draggable
                    onDragStart={(e) => onDragStart(e, eq.kind)}
                    className="group flex cursor-grab items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-2.5 active:cursor-grabbing hover:border-slate-600"
                    style={{ borderLeft: `3px solid ${eq.color}` }}
                  >
                    <div className="rounded-md p-2" style={{ background: `${eq.color}22`, color: eq.color }}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-slate-100">{eq.label}</div>
                      <div className="truncate text-[10px] text-slate-500">{eq.subtitle}</div>
                    </div>
                    <button
                      onClick={() => onAdd(eq.kind)}
                      className="rounded-md bg-slate-800 p-1.5 text-slate-300 hover:bg-sky-600 hover:text-white"
                      aria-label={`Add ${eq.label}`}
                    >
                      <Plus size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="border-t border-slate-800 p-3">
        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Purdue zones</h3>
        <ul className="space-y-1">
          {ZONES.map((z) => (
            <li key={z.id} className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: z.color }} />
              <span className="flex-1">{z.label}</span>
              <span className="text-slate-600">{z.level}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
