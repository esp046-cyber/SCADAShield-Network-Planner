import { EQUIPMENT_BY_KIND, PROTOCOLS, ZONES, ZONE_BY_ID } from './catalog'
import { FR_NAMES, EVALUATED_FRS } from './securityRules'

export const APP_NAME = 'SCADAShield Network Planner'
export const APP_VERSION = '1.0.0'

const DISCLAIMER =
  'This report is an automated topology screening against a limited subset of IEC 62443 zone/conduit concepts ' +
  '(IEC 62443-3-2 and selected SR 4.x / 5.x requirements of IEC 62443-3-3). It is not a certification, an audit result, ' +
  'or a substitute for a formal risk assessment performed by qualified personnel.'

/* ------------------------------------------------------------------ */
/* Report object (also the JSON export)                                */
/* ------------------------------------------------------------------ */
export function buildReport({ projectName, nodes, edges, analysis }) {
  const devices = nodes
    .filter((n) => n.type === 'industrial' && EQUIPMENT_BY_KIND[n.data?.kind])
    .map((n) => {
      const eq = EQUIPMENT_BY_KIND[n.data.kind]
      const zoneId = analysis.zoneByNode[n.id]
      return {
        id: n.id,
        name: n.data.label || eq.label,
        type: eq.label,
        vendor: eq.vendor,
        zone: zoneId ? ZONE_BY_ID[zoneId].label : 'Unzoned',
        zoneId: zoneId ?? null,
        address: n.data.ip || ''
      }
    })
  const byId = Object.fromEntries(devices.map((d) => [d.id, d]))

  const conduits = edges
    .filter((e) => byId[e.source] && byId[e.target])
    .map((e) => {
      const p = PROTOCOLS[e.data?.protocol] ?? PROTOCOLS.opcua
      return {
        id: e.id,
        from: byId[e.source].name,
        fromZone: byId[e.source].zone,
        to: byId[e.target].name,
        toZone: byId[e.target].zone,
        protocol: p.label,
        port: p.port,
        nativelyEncrypted: p.encrypted,
        vpnTunnel: !!e.data?.vpnTunnel,
        effectivelyEncrypted: p.encrypted || !!e.data?.vpnTunnel
      }
    })

  return {
    schema: 'scadashield.report/1',
    tool: { name: APP_NAME, version: APP_VERSION },
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    project: { name: projectName || 'Untitled project' },
    summary: {
      score: analysis.score,
      verdict: analysis.verdict,
      findings: analysis.counts,
      devices: analysis.deviceCount,
      conduits: analysis.linkStats
    },
    iec62443: {
      evaluatedRequirements: analysis.frStatus.map((f) => ({
        requirement: f.fr,
        name: f.name,
        status: f.status,
        findings: f.findings
      })),
      notEvaluated: Object.keys(FR_NAMES)
        .filter((fr) => !EVALUATED_FRS.includes(fr))
        .map((fr) => ({ requirement: fr, name: FR_NAMES[fr], reason: 'Cannot be assessed from network topology alone' }))
    },
    architecture: {
      zones: ZONES.map((z) => ({
        id: z.id,
        name: z.label,
        purdueLevel: z.level,
        devices: devices.filter((d) => d.zoneId === z.id).map((d) => d.name)
      })),
      devices,
      conduits
    },
    findings: analysis.issues.map((i) => ({
      severity: i.severity,
      rule: i.ruleId,
      title: i.title,
      detail: i.message,
      remediation: i.remediation,
      standard: { requirement: i.fr, reference: i.ref }
    }))
  }
}

/* ------------------------------------------------------------------ */
/* Download helpers                                                    */
/* ------------------------------------------------------------------ */
const stamp = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

export function downloadJSON(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `scadashield-report-${stamp()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

const SEV_COLOR = { error: [190, 18, 60], warning: [180, 83, 9], info: [71, 85, 105] }
const STATUS_COLOR = { pass: [4, 120, 87], attention: [180, 83, 9], fail: [190, 18, 60], 'n/a': [100, 116, 139] }

export async function downloadPDF(report) {
  const { jsPDF } = await import('jspdf') // lazy-loaded, still precached for offline use
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 44
  const CW = W - M * 2
  let y = M

  const ensure = (h) => {
    if (y + h > H - M) {
      doc.addPage()
      y = M
    }
  }

  const text = (str, { size = 10, bold = false, color = [30, 41, 59], indent = 0, gap = 4 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lh = size * 1.35
    for (const line of doc.splitTextToSize(String(str), CW - indent)) {
      ensure(lh)
      doc.text(line, M + indent, y + size)
      y += lh
    }
    y += gap
  }

  const heading = (str) => {
    ensure(40)
    y += 8
    text(str, { size: 13, bold: true, color: [8, 145, 178], gap: 2 })
    doc.setDrawColor(203, 213, 225)
    doc.line(M, y, W - M, y)
    y += 8
  }

  /* Title */
  text(APP_NAME, { size: 20, bold: true, color: [11, 18, 32], gap: 0 })
  text('Network Security Validation Report (IEC 62443 concepts)', { size: 11, color: [71, 85, 105], gap: 8 })
  text(`Project: ${report.project.name}`, { bold: true, gap: 0 })
  text(`Generated: ${new Date(report.generatedAt).toLocaleString()}   |   Tool version ${report.tool.version}`, {
    size: 9,
    color: [100, 116, 139],
    gap: 10
  })

  /* Score box */
  ensure(78)
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(M, y, CW, 64, 6, 6, 'F')
  const s = report.summary
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  const scoreColor = s.score == null ? [100, 116, 139] : s.score >= 85 ? [4, 120, 87] : s.score >= 60 ? [180, 83, 9] : [190, 18, 60]
  doc.setTextColor(...scoreColor)
  doc.text(s.score == null ? '--' : String(s.score), M + 18, y + 42)
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text('/ 100 posture score', M + 18 + (s.score == null ? 40 : 52), y + 42)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(`Verdict: ${s.verdict}`, M + 220, y + 26)
  doc.setFont('helvetica', 'normal')
  doc.text(`${s.findings.error} errors, ${s.findings.warning} warnings, ${s.findings.info} notes`, M + 220, y + 42)
  doc.text(`${s.devices} devices, ${s.conduits.total} conduits, ${s.conduits.cleartext} cleartext`, M + 220, y + 56)
  y += 78

  /* IEC 62443 */
  heading('IEC 62443 foundational requirements screened')
  for (const f of report.iec62443.evaluatedRequirements) {
    text(`${f.requirement.replace('FR', 'FR ')} - ${f.name}:  ${f.status.toUpperCase()}  (${f.findings} finding${f.findings === 1 ? '' : 's'})`, {
      bold: true,
      color: STATUS_COLOR[f.status],
      gap: 2
    })
  }
  text(`Not evaluated (needs more than topology): ${report.iec62443.notEvaluated.map((n) => n.requirement).join(', ')}`, {
    size: 9,
    color: [100, 116, 139],
    gap: 6
  })

  /* Zones */
  heading('Zone inventory (Purdue Model)')
  for (const z of report.architecture.zones) {
    text(`${z.name} [${z.purdueLevel}]`, { bold: true, gap: 0 })
    text(z.devices.length ? z.devices.join(', ') : 'No devices', { indent: 12, size: 9, color: [71, 85, 105], gap: 4 })
  }

  /* Conduits */
  heading('Conduits (connections)')
  if (!report.architecture.conduits.length) text('No connections defined.', { color: [100, 116, 139] })
  report.architecture.conduits.forEach((c, i) => {
    text(`${i + 1}. ${c.from} (${c.fromZone}) -> ${c.to} (${c.toZone})`, { bold: true, size: 9, gap: 0 })
    text(
      `${c.protocol}, port ${c.port}, ${c.effectivelyEncrypted ? 'encrypted' : 'CLEARTEXT'}${c.vpnTunnel ? ', VPN tunnel' : ''}`,
      { indent: 12, size: 9, color: c.effectivelyEncrypted ? [4, 120, 87] : [180, 83, 9], gap: 3 }
    )
  })

  /* Findings */
  heading(`Findings (${report.findings.length})`)
  if (!report.findings.length) text('No findings. The design passed all implemented checks.', { color: [4, 120, 87] })
  report.findings.forEach((f, i) => {
    ensure(60)
    text(`${i + 1}. [${f.severity.toUpperCase()}] ${f.title}`, { bold: true, color: SEV_COLOR[f.severity], gap: 1 })
    text(f.detail, { indent: 14, size: 9, gap: 1 })
    text(`Remediation: ${f.remediation}`, { indent: 14, size: 9, color: [71, 85, 105], gap: 1 })
    text(`Reference: ${f.standard.requirement}, ${f.standard.reference}`, { indent: 14, size: 8, color: [100, 116, 139], gap: 6 })
  })

  /* Disclaimer */
  heading('Disclaimer')
  text(report.disclaimer, { size: 8.5, color: [100, 116, 139] })

  /* Footer */
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`${APP_NAME}  |  ${report.project.name}`, M, H - 22)
    doc.text(`Page ${p} / ${pages}`, W - M, H - 22, { align: 'right' })
  }

  doc.save(`scadashield-report-${stamp()}.pdf`)
}
