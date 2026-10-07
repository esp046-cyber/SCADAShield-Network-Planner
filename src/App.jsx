import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactFlowProvider, addEdge, useEdgesState, useNodesState, useReactFlow } from 'reactflow'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import Header from './components/Header.jsx'
import EquipmentSidebar from './components/EquipmentSidebar.jsx'
import NetworkCanvas from './components/NetworkCanvas.jsx'
import SecurityPanel from './components/SecurityPanel.jsx'
import Header from './components/Header'
import EquipmentSidebar from './components/EquipmentSidebar'
import NetworkCanvas from './components/NetworkCanvas'
import SecurityPanel from './components/SecurityPanel'
import { EQUIPMENT_BY_KIND, GRID, LANE_HEIGHT, ZONES } from './lib/catalog'
import { validateNetwork } from './lib/securityRules'
import { TEMPLATES, withLanes } from './lib/sampleProject'
import { buildReport, downloadJSON, downloadPDF } from './lib/exportReport'

const STORAGE_KEY = 'scadashield:project:v1'
const snap = (v) => Math.round(v / GRID) * GRID
const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/* ------------------------------------------------------------------ */
/* Persistence (offline autosave)                                      */
/* ------------------------------------------------------------------ */
function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!Array.isArray(p.nodes) || !Array.isArray(p.edges)) return null
    return p
  } catch {
    return null
  }
}

function saveProject(projectName, nodes, edges) {
  try {
    const devices = nodes
      .filter((n) => n.type === 'industrial')
      .map((n) => ({ id: n.id, type: n.type, position: n.position, data: { kind: n.data.kind, label: n.data.label, ip: n.data.ip ?? '' } }))
    const links = edges.map((e) => ({
      id: e.id, source: e.source, sourceHandle: e.sourceHandle, target: e.target, targetHandle: e.targetHandle,
      type: e.type, data: e.data
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ projectName, nodes: devices, edges: links }))
  } catch {
    /* storage may be unavailable or full: ignore */
  }
}

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

/* ------------------------------------------------------------------ */
/* PWA update / offline-ready prompt                                   */
/* ------------------------------------------------------------------ */
function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000) // hourly update check
    },
    onRegisterError(error) {
      console.error('Service worker registration failed', error)
    }
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-2xl"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <RefreshCw size={18} className="shrink-0 text-shield-400" />
      <p className="flex-1 text-xs text-slate-200">
        {needRefresh ? 'A new version of SCADAShield is available.' : 'Ready to work offline. Your designs are saved on this device.'}
      </p>
      {needRefresh && (
        <button onClick={() => updateServiceWorker(true)} className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500">
          Update
        </button>
      )}
      <button onClick={close} className="rounded p-1 text-slate-400 hover:bg-slate-800" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Studio (needs React Flow context)                                   */
/* ------------------------------------------------------------------ */
function Studio() {
  const initial = useMemo(() => {
    const saved = loadProject()
    if (saved) return saved
    const t = TEMPLATES.secure.build()
    return { projectName: 'Water Treatment Plant: Secure Reference', ...t }
  }, [])

  const [projectName, setProjectName] = useState(initial.projectName ?? '')
  const [nodes, setNodes, onNodesChange] = useNodesState(withLanes(initial.nodes))
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const canvasRef = useRef(null)
  const online = useOnline()
  const { screenToFlowPosition, fitView } = useReactFlow()

  const analysis = useMemo(() => validateNetwork(nodes, edges), [nodes, edges])

  /* Debounced autosave */
  useEffect(() => {
    const t = setTimeout(() => saveProject(projectName, nodes, edges), 400)
    return () => clearTimeout(t)
  }, [projectName, nodes, edges])

  const selectedNode = useMemo(() => nodes.find((n) => n.selected && n.type === 'industrial') ?? null, [nodes])
  const selectedEdge = useMemo(() => (selectedNode ? null : edges.find((e) => e.selected) ?? null), [edges, selectedNode])

  /* ---------- Graph mutations ---------- */
  const onConnect = useCallback(
    (params) =>
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep', data: { protocol: 'opcua', vpnTunnel: false } }, eds)),
    [setEdges]
  )

  const addNode = useCallback(
    (kind, position) => {
      const eq = EQUIPMENT_BY_KIND[kind]
      if (!eq) return
      let pos = position
      if (!pos) {
        // Tap-to-add (touch friendly): horizontal centre of the viewport, first allowed zone
        const rect = canvasRef.current?.getBoundingClientRect()
        const c = rect
          ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
          : { x: 400, y: 0 }
        const laneIdx = ZONES.findIndex((z) => z.id === eq.allowedZones[0])
        pos = { x: c.x - 88 + (Math.random() - 0.5) * 120, y: laneIdx * LANE_HEIGHT + 85 + (Math.random() - 0.5) * 40 }
      }
      const node = {
        id: uid('node'),
        type: 'industrial',
        position: { x: snap(pos.x), y: snap(pos.y) },
        data: { kind, label: eq.defaultName, ip: '' },
        selected: true
      }
      setNodes((ns) => [...ns.map((n) => (n.selected ? { ...n, selected: false } : n)), node])
      setLeftOpen(false)
    },
    [screenToFlowPosition, setNodes]
  )

  const updateNode = useCallback(
    (id, patch) => setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))),
    [setNodes]
  )
  const updateEdge = useCallback(
    (id, patch) => setEdges((es) => es.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...patch } } : e))),
    [setEdges]
  )
  const deleteNode = useCallback(
    (id) => {
      setNodes((ns) => ns.filter((n) => n.id !== id))
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id))
    },
    [setNodes, setEdges]
  )
  const deleteEdge = useCallback((id) => setEdges((es) => es.filter((e) => e.id !== id)), [setEdges])

  const loadTemplate = useCallback(
    (key) => {
      const hasWork = nodes.some((n) => n.type === 'industrial')
      if (hasWork && !window.confirm('Replace the current diagram with this template?')) return
      const t = TEMPLATES[key]
      if (!t) return
      const built = t.build()
      setNodes(withLanes(built.nodes))
      setEdges(built.edges)
      if (key !== 'blank') setProjectName(t.label)
      setTimeout(() => fitView({ padding: 0.02, duration: 400 }), 60)
    },
    [nodes, setNodes, setEdges, fitView]
  )

  const focusIssue = useCallback(
    (issue) => {
      const edgeId = issue.edgeIds[0]
      const nodeId = issue.nodeIds[0]
      setNodes((ns) => ns.map((n) => (n.type === 'industrial' ? { ...n, selected: !edgeId && n.id === nodeId } : n)))
      setEdges((es) => es.map((e) => ({ ...e, selected: e.id === edgeId })))
      if (issue.nodeIds.length) {
        fitView({ nodes: issue.nodeIds.map((id) => ({ id })), padding: 0.8, maxZoom: 1, duration: 500 })
      }
      setRightOpen(false)
    },
    [setNodes, setEdges, fitView]
  )

  /* ---------- Export ---------- */
  const makeReport = useCallback(
    () => buildReport({ projectName, nodes, edges, analysis }),
    [projectName, nodes, edges, analysis]
  )
  const exportPDF = useCallback(async () => {
    setExporting(true)
    try {
      await downloadPDF(makeReport())
    } catch (err) {
      console.error(err)
      window.alert('PDF export failed. Try the JSON export or check the console for details.')
    } finally {
      setExporting(false)
    }
  }, [makeReport])
  const exportJSON = useCallback(() => downloadJSON(makeReport()), [makeReport])

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-950 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-slate-100">
      <Header
        projectName={projectName}
        onProjectName={setProjectName}
        onExportPDF={exportPDF}
        onExportJSON={exportJSON}
        exporting={exporting}
        onLoadTemplate={loadTemplate}
        onToggleSidebar={() => {
          setRightOpen(false)
          setLeftOpen((v) => !v)
        }}
        onTogglePanel={() => {
          setLeftOpen(false)
          setRightOpen((v) => !v)
        }}
        counts={analysis.counts}
        online={online}
      />

      <div className="relative flex min-h-0 flex-1">
        {(leftOpen || rightOpen) && (
          <div
            className="absolute inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => {
              setLeftOpen(false)
              setRightOpen(false)
            }}
          />
        )}

        <EquipmentSidebar open={leftOpen} onClose={() => setLeftOpen(false)} onAdd={(k) => addNode(k)} />

        <main ref={canvasRef} className="relative min-w-0 flex-1">
          <NetworkCanvas
            nodes={nodes}
            edges={edges}
            analysis={analysis}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDropKind={addNode}
          />
        </main>

        <SecurityPanel
          open={rightOpen}
          onClose={() => setRightOpen(false)}
          analysis={analysis}
          nodes={nodes}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={updateNode}
          onUpdateEdge={updateEdge}
          onDeleteNode={deleteNode}
          onDeleteEdge={deleteEdge}
          onFocusIssue={focusIssue}
        />
      </div>

      <ReloadPrompt />
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Studio />
    </ReactFlowProvider>
  )
}
