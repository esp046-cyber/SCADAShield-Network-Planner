import { EQUIPMENT_BY_KIND, PROTOCOLS, ZONES, getZoneForY, NODE_HEIGHT } from './catalog'

/* ------------------------------------------------------------------ */
/* IEC 62443 foundational requirements (names per IEC 62443-1-1)       */
/* Only FR4 and FR5 can be screened from topology alone.               */
/* ------------------------------------------------------------------ */
export const FR_NAMES = {
  FR1: 'Identification and authentication control',
  FR2: 'Use control',
  FR3: 'System integrity',
  FR4: 'Data confidentiality',
  FR5: 'Restricted data flow',
  FR6: 'Timely response to events',
  FR7: 'Resource availability'
}
export const EVALUATED_FRS = ['FR4', 'FR5']

/* ------------------------------------------------------------------ */
/* Rule catalogue                                                      */
/* ------------------------------------------------------------------ */
export const RULES = {
  PLC_EXPOSED_BUSINESS_LAN: {
    severity: 'error', fr: 'FR5', ref: 'IEC 62443-3-3 SR 5.2',
    title: 'PLC exposed directly to Business LAN',
    remediation: 'Remove the direct link. Route all enterprise access through an Industrial DMZ with a firewall and a broker (historian replica, jump host, OPC UA gateway).'
  },
  CRITICAL_ASSET_IN_ENTERPRISE: {
    severity: 'error', fr: 'FR5', ref: 'IEC 62443-3-2 ZCR 3',
    title: 'Control asset placed in the Enterprise zone',
    remediation: 'Move PLCs, SCADA servers, HMIs and field devices into the Supervisory, Control or Field zones.'
  },
  ZONE_SKIP: {
    severity: 'error', fr: 'FR5', ref: 'IEC 62443-3-3 SR 5.1',
    title: 'Conduit skips one or more Purdue zones',
    remediation: 'Insert an intermediate zone and a zone-boundary firewall so traffic traverses each level in order.'
  },
  BOUNDARY_NO_FIREWALL: {
    severity: 'error', fr: 'FR5', ref: 'IEC 62443-3-3 SR 5.2',
    title: 'Zone boundary crossed without a firewall',
    remediation: 'Place a firewall (or VPN/security gateway) on this conduit and apply a deny-by-default rule set.'
  },
  UNENCRYPTED_DMZ_CROSSING: {
    severity: 'error', fr: 'FR4', ref: 'IEC 62443-3-3 SR 4.1 / SR 4.3',
    title: 'Unencrypted protocol crossing DMZ without VPN',
    remediation: 'Use a secured protocol (e.g. OPC UA Sign & Encrypt, HTTPS) or wrap the link in an IPsec/TLS VPN tunnel.'
  },
  CLEARTEXT_CROSSING: {
    severity: 'info', fr: 'FR4', ref: 'IEC 62443-3-3 SR 4.1',
    title: 'Cleartext protocol crossing a zone boundary',
    remediation: 'Prefer the secured variant of the protocol (e.g. CIP Security, S7CommPlus with TLS) where the device supports it.'
  },
  RISKY_PROTOCOL_CROSSING: {
    severity: 'warning', fr: 'FR5', ref: 'IEC 62443-3-3 SR 5.2',
    title: 'Lateral-movement-prone protocol crosses zones',
    remediation: 'Avoid RDP, SMB and DCOM-based OPC across zones. Use a hardened jump host, or OPC UA through the DMZ.'
  },
  DMZ_BYPASS: {
    severity: 'error', fr: 'FR5', ref: 'IEC 62443-3-2 ZCR 3',
    title: 'Attack path from Enterprise bypasses the DMZ',
    remediation: 'Break the path so that every route from the Enterprise zone passes through a node in the Industrial DMZ.'
  },
  FLAT_SWITCH: {
    severity: 'warning', fr: 'FR5', ref: 'IEC 62443-3-3 SR 5.1',
    title: 'Switch bridges multiple security zones',
    remediation: 'Use dedicated switches per zone, or enforce VLANs with inter-zone routing through a firewall.'
  },
  FIREWALL_SINGLE_INTERFACE: {
    severity: 'warning', fr: 'FR5', ref: 'IEC 62443-3-3 SR 5.2',
    title: 'Firewall has fewer than two connected interfaces',
    remediation: 'A firewall only enforces a boundary when it sits between two zones. Connect both sides.'
  },
  ASSET_MISPLACED: {
    severity: 'warning', fr: 'FR5', ref: 'IEC 62443-3-2 ZCR 3',
    title: 'Asset placed outside its expected Purdue zone',
    remediation: 'Move the asset to a zone that matches its role in the Purdue reference model.'
  },
  NO_DMZ: {
    severity: 'warning', fr: 'FR5', ref: 'IEC 62443-3-2 ZCR 3',
    title: 'No Industrial DMZ in the architecture',
    remediation: 'Introduce an Industrial DMZ (Purdue Level 3.5) between enterprise and operations networks.'
  },
  NO_FIREWALL: {
    severity: 'warning', fr: 'FR5', ref: 'IEC 62443-3-3 SR 5.2',
    title: 'No firewall present between populated zones',
    remediation: 'Add at least one zone-boundary firewall between the Enterprise and operational zones.'
  },
  UNZONED: {
    severity: 'warning', fr: 'FR5', ref: 'IEC 62443-3-2 ZCR 3',
    title: 'Node is outside every Purdue swimlane',
    remediation: 'Drag the node into one of the swimlanes so it is assigned to a security zone.'
  },
  ORPHAN_NODE: {
    severity: 'info', fr: 'FR5', ref: 'IEC 62443-3-2 ZCR 3',
    title: 'Node has no connections',
    remediation: 'Connect the node to its conduit or remove it from the design.'
  }
}

const CRITICAL_CLASSES = new Set(['plc', 'server', 'hmi', 'field'])
const SEV_ORDER = { error: 0, warning: 1, info: 2 }
const SEV_COST = { error: 15, warning: 5, info: 1 }

const worse = (cur, next) => (!cur || SEV_ORDER[next] < SEV_ORDER[cur] ? next : cur)

/* ------------------------------------------------------------------ */
/* Main analysis                                                       */
/* ------------------------------------------------------------------ */
export function validateNetwork(nodes = [], edges = []) {
  const devices = nodes.filter((n) => n.type === 'industrial')
  const info = new Map()

  for (const n of devices) {
    const eq = EQUIPMENT_BY_KIND[n.data?.kind]
    if (!eq) continue
    const zone = getZoneForY(n.position.y + (n.height ?? NODE_HEIGHT) / 2)
    info.set(n.id, { id: n.id, label: n.data?.label || eq.label, eq, zone })
  }

  const links = edges.filter((e) => info.has(e.source) && info.has(e.target) && e.source !== e.target)
  const adj = new Map([...info.keys()].map((id) => [id, []]))
  for (const e of links) {
    adj.get(e.source).push(e.target)
    adj.get(e.target).push(e.source)
  }

  const issues = []
  const add = (ruleId, message, { nodeIds = [], edgeIds = [], severity } = {}) => {
    const r = RULES[ruleId]
    issues.push({
      id: `${ruleId}:${[...nodeIds, ...edgeIds].join('+')}`,
      ruleId,
      severity: severity ?? r.severity,
      title: r.title,
      message,
      remediation: r.remediation,
      fr: r.fr,
      ref: r.ref,
      nodeIds,
      edgeIds
    })
  }

  /* ---------------- Node-level rules ---------------- */
  for (const d of info.values()) {
    const deg = adj.get(d.id).length

    if (!d.zone) {
      add('UNZONED', `${d.label} is not inside any Purdue swimlane.`, { nodeIds: [d.id] })
    } else if (!d.eq.allowedZones.includes(d.zone.id)) {
      if (d.zone.id === 'enterprise' && CRITICAL_CLASSES.has(d.eq.cls)) {
        add('CRITICAL_ASSET_IN_ENTERPRISE', `${d.label} (${d.eq.label}) is located in the Enterprise zone.`, { nodeIds: [d.id] })
      } else {
        const expected = d.eq.allowedZones.map((z) => ZONES.find((x) => x.id === z).short).join(', ')
        add('ASSET_MISPLACED', `${d.label} (${d.eq.label}) is in the ${d.zone.short} zone; expected: ${expected}.`, { nodeIds: [d.id] })
      }
    }

    if (d.eq.kind === 'firewall' && deg < 2) {
      add('FIREWALL_SINGLE_INTERFACE', `${d.label} has ${deg} connection(s); it cannot separate two zones.`, { nodeIds: [d.id] })
    } else if (deg === 0) {
      add('ORPHAN_NODE', `${d.label} is not connected to anything.`, { nodeIds: [d.id] })
    }

    if (d.eq.cls === 'switch') {
      const zones = new Set()
      if (d.zone) zones.add(d.zone.short)
      for (const nb of adj.get(d.id)) {
        const n = info.get(nb)
        if (n.eq.cls !== 'boundary' && n.zone) zones.add(n.zone.short)
      }
      if (zones.size > 1) {
        add('FLAT_SWITCH', `${d.label} connects devices in: ${[...zones].join(', ')}.`, { nodeIds: [d.id] })
      }
    }
  }

  /* ---------------- Edge-level rules ---------------- */
  let encryptedLinks = 0
  let crossingLinks = 0

  for (const e of links) {
    const a = info.get(e.source)
    const b = info.get(e.target)
    const proto = PROTOCOLS[e.data?.protocol] ?? PROTOCOLS.opcua
    const tunnel = !!e.data?.vpnTunnel
    const enc = proto.encrypted || tunnel
    if (enc) encryptedLinks++
    if (!a.zone || !b.zone) continue

    const lo = Math.min(a.zone.rank, b.zone.rank)
    const hi = Math.max(a.zone.rank, b.zone.rank)
    const diff = hi - lo
    if (diff > 0) crossingLinks++

    const ref = { edgeIds: [e.id], nodeIds: [a.id, b.id] }
    const pair = `${a.label} (${a.zone.short}) <-> ${b.label} (${b.zone.short})`
    const boundary = a.eq.cls === 'boundary' || b.eq.cls === 'boundary'

    const exposed =
      (a.eq.cls === 'plc' && b.zone.id === 'enterprise') || (b.eq.cls === 'plc' && a.zone.id === 'enterprise')

    if (exposed) {
      add('PLC_EXPOSED_BUSINESS_LAN', `${pair} connects a controller straight to the Business LAN.`, ref)
    } else if (diff >= 2) {
      add('ZONE_SKIP', `${pair} skips ${diff - 1} zone(s)${boundary ? ' (a boundary device is present, verify its rules)' : ''}.`, {
        ...ref,
        severity: boundary ? 'warning' : 'error'
      })
    } else if (diff === 1 && lo <= 2 && !boundary) {
      add('BOUNDARY_NO_FIREWALL', `${pair} crosses a zone boundary with no firewall or VPN gateway.`, {
        ...ref,
        severity: lo <= 1 ? 'error' : 'warning'
      })
    }

    const crossesDmz = diff > 0 && lo <= 1 && hi >= 1
    const lowLevelExempt = diff === 1 && lo === 3 // Control <-> Field is normally direct-wired
    if (crossesDmz && !enc) {
      add('UNENCRYPTED_DMZ_CROSSING', `${pair} uses ${proto.label} (cleartext) across the DMZ with no VPN tunnel.`, ref)
    } else if (diff > 0 && !enc && !lowLevelExempt) {
      add('CLEARTEXT_CROSSING', `${pair} uses ${proto.label} (cleartext).`, ref)
    }

    if (proto.risky && diff > 0) {
      add('RISKY_PROTOCOL_CROSSING', `${pair} uses ${proto.label} across zones.`, ref)
    }
  }

  /* ---------------- Path analysis: Enterprise -> OT without DMZ ---------------- */
  const sources = [...info.values()].filter((d) => d.zone?.id === 'enterprise')
  if (sources.length) {
    const dist = new Map(sources.map((s) => [s.id, 0]))
    const queue = sources.map((s) => s.id)
    while (queue.length) {
      const id = queue.shift()
      for (const nb of adj.get(id)) {
        if (dist.has(nb)) continue
        if (info.get(nb).zone?.id === 'dmz') continue // traffic must stop at the DMZ
        dist.set(nb, dist.get(id) + 1)
        queue.push(nb)
      }
    }
    for (const [id, hops] of dist) {
      const n = info.get(id)
      // hops === 1 targets are already flagged on the edge itself
      if (hops >= 2 && n.zone && n.zone.rank >= 2 && n.eq.cls !== 'switch' && n.eq.cls !== 'boundary') {
        add('DMZ_BYPASS', `${n.label} (${n.zone.short}) is reachable from the Enterprise zone in ${hops} hops without crossing the DMZ.`, {
          nodeIds: [id]
        })
      }
    }
  }

  /* ---------------- Architecture-level rules ---------------- */
  const populated = new Set([...info.values()].filter((d) => d.zone).map((d) => d.zone.id))
  const hasOt = ['supervisory', 'control', 'field'].some((z) => populated.has(z))
  if (populated.has('enterprise') && hasOt && !populated.has('dmz')) {
    add('NO_DMZ', 'Enterprise and operational zones are populated but the Industrial DMZ is empty.')
  }
  if (populated.size > 1 && ![...info.values()].some((d) => d.eq.kind === 'firewall')) {
    add('NO_FIREWALL', `${populated.size} zones are populated but the design contains no firewall.`)
  }

  issues.sort((x, y) => SEV_ORDER[x.severity] - SEV_ORDER[y.severity] || x.ruleId.localeCompare(y.ruleId))

  /* ---------------- Summaries ---------------- */
  const counts = { error: 0, warning: 0, info: 0 }
  const severityByNode = {}
  const severityByEdge = {}
  let deduction = 0
  for (const i of issues) {
    counts[i.severity]++
    deduction += SEV_COST[i.severity]
    i.nodeIds.forEach((id) => (severityByNode[id] = worse(severityByNode[id], i.severity)))
    i.edgeIds.forEach((id) => (severityByEdge[id] = worse(severityByEdge[id], i.severity)))
  }

  const empty = info.size === 0
  const score = empty ? null : Math.max(0, 100 - deduction)
  const verdict = empty
    ? 'No design to evaluate'
    : counts.error > 0
      ? 'Not aligned'
      : counts.warning > 0
        ? 'Partially aligned'
        : 'Aligned (basic checks)'

  const frStatus = EVALUATED_FRS.map((fr) => {
    const related = issues.filter((i) => i.fr === fr)
    const status = empty
      ? 'n/a'
      : related.some((i) => i.severity === 'error')
        ? 'fail'
        : related.some((i) => i.severity === 'warning')
          ? 'attention'
          : 'pass'
    return {
      fr,
      name: FR_NAMES[fr],
      status,
      findings: related.length,
      errors: related.filter((i) => i.severity === 'error').length,
      warnings: related.filter((i) => i.severity === 'warning').length
    }
  })

  const zoneByNode = Object.fromEntries([...info.values()].map((d) => [d.id, d.zone?.id ?? null]))

  return {
    issues,
    counts,
    score,
    verdict,
    frStatus,
    severityByNode,
    severityByEdge,
    zoneByNode,
    deviceCount: info.size,
    linkStats: {
      total: links.length,
      encrypted: encryptedLinks,
      cleartext: links.length - encryptedLinks,
      zoneCrossing: crossingLinks
    }
  }
}
