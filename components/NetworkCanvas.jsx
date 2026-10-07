import { useCallback, useMemo } from 'react'
import ReactFlow, { Background, BackgroundVariant, ConnectionMode, Controls, MiniMap, useReactFlow } from 'reactflow'
import { IndustrialNode, ZoneLane } from './CanvasNodes'
import { DND_MIME, EQUIPMENT_BY_KIND, GRID, PROTOCOLS } from '../lib/catalog'

const nodeTypes = { industrial: IndustrialNode, lane: ZoneLane }

const SEV_STROKE = { error: '#f43f5e', warning: '#f59e0b' }

export default function NetworkCanvas({ nodes, edges, analysis, onNodesChange, onEdgesChange, onConnect, onDropKind }) {
  const { screenToFlowPosition } = useReactFlow()

  /* Decorate nodes/edges with validation state without touching the source of truth */
  const viewNodes = useMemo(
    () =>
      nodes.map((n) =>
        n.type === 'industrial' ? { ...n, data: { ...n.data, severity: analysis.severityByNode[n.id] ?? null } } : n
      ),
    [nodes, analysis]
  )

  const viewEdges = useMemo(
    () =>
      edges.map((e) => {
        const proto = PROTOCOLS[e.data?.protocol] ?? PROTOCOLS.opcua
        const tunnel = !!e.data?.vpnTunnel
        const enc = proto.encrypted || tunnel
        const sev = analysis.severityByEdge[e.id]
        const stroke = SEV_STROKE[sev] ?? (enc ? '#10b981' : '#94a3b8')
        return {
          ...e,
          label: `${proto.label}${tunnel ? ' + VPN' : ''}`,
          animated: sev === 'error',
          style: { stroke, strokeWidth: e.selected ? 3.5 : 2, strokeDasharray: tunnel && sev !== 'error' ? '7 4' : undefined },
          labelStyle: { fill: '#e2e8f0' },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9 },
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 4
        }
      }),
    [edges, analysis]
  )

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      const kind = e.dataTransfer.getData(DND_MIME)
      if (!kind) return
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      onDropKind(kind, { x: p.x - 88, y: p.y - 34 })
    },
    [screenToFlowPosition, onDropKind]
  )

  return (
    <ReactFlow
      nodes={viewNodes}
      edges={viewEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      isValidConnection={(c) => c.source !== c.target}
      connectionMode={ConnectionMode.Loose}
      defaultEdgeOptions={{ type: 'smoothstep' }}
      snapToGrid
      snapGrid={[GRID, GRID]}
      fitView
      fitViewOptions={{ padding: 0.02 }}
      minZoom={0.1}
      maxZoom={1.8}
      interactionWidth={24}
      deleteKeyCode={['Backspace', 'Delete']}
      multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
      proOptions={{ hideAttribution: false }}
    >
      <Background variant={BackgroundVariant.Dots} gap={GRID} size={1} color="#1e293b" />
      <Controls showInteractive={false} position="bottom-left" />
      <MiniMap
        pannable
        zoomable
        position="bottom-right"
        className="!hidden sm:!block"
        maskColor="rgba(2,6,23,0.7)"
        nodeColor={(n) => (n.type === 'lane' ? '#0f172a' : EQUIPMENT_BY_KIND[n.data?.kind]?.color ?? '#64748b')}
        nodeStrokeWidth={0}
      />
    </ReactFlow>
  )
}
