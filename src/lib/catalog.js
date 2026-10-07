import { ShieldCheck, Network, Server, Monitor, Cpu, CircuitBoard, Lock, Laptop, Gauge } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Canvas geometry                                                     */
/* ------------------------------------------------------------------ */
export const LANE_HEIGHT = 240
export const LANE_WIDTH = 1800
export const NODE_HEIGHT = 68
export const GRID = 20
export const DND_MIME = 'application/x-scadashield-kind'

/* ------------------------------------------------------------------ */
/* Purdue Model zones (top -> bottom). A node's zone is derived from   */
/* the swimlane its vertical centre sits in.                           */
/* ------------------------------------------------------------------ */
export const ZONES = [
  { id: 'enterprise', rank: 0, label: 'Enterprise Zone', short: 'Enterprise', level: 'Purdue L4-5', color: '#818cf8' },
  { id: 'dmz', rank: 1, label: 'Industrial DMZ', short: 'DMZ', level: 'Purdue L3.5', color: '#fbbf24' },
  { id: 'supervisory', rank: 2, label: 'Supervisory Level', short: 'Supervisory', level: 'Purdue L2-3', color: '#38bdf8' },
  { id: 'control', rank: 3, label: 'Control Level', short: 'Control', level: 'Purdue L1', color: '#34d399' },
  { id: 'field', rank: 4, label: 'Field Level', short: 'Field', level: 'Purdue L0', color: '#c084fc' }
]

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]))

export function getZoneForY(y) {
  if (y < 0) return null
  const idx = Math.floor(y / LANE_HEIGHT)
  return ZONES[idx] ?? null
}

export const createLaneNodes = () =>
  ZONES.map((zone, i) => ({
    id: `lane-${zone.id}`,
    type: 'lane',
    position: { x: 0, y: i * LANE_HEIGHT },
    data: { zone },
    style: { width: LANE_WIDTH, height: LANE_HEIGHT },
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    deletable: false,
    zIndex: -1
  }))

/* ------------------------------------------------------------------ */
/* Equipment palette                                                   */
/*  cls: boundary | switch | server | hmi | plc | field | it           */
/* ------------------------------------------------------------------ */
export const EQUIPMENT = [
  {
    kind: 'firewall', group: 'Network & Security', label: 'Industrial Firewall', subtitle: 'Zone boundary enforcement',
    vendor: 'Generic', cls: 'boundary', defaultName: 'Firewall', color: '#f43f5e', Icon: ShieldCheck,
    allowedZones: ['enterprise', 'dmz', 'supervisory', 'control', 'field']
  },
  {
    kind: 'vpn', group: 'Network & Security', label: 'VPN Gateway', subtitle: 'IPsec / TLS remote access',
    vendor: 'Generic', cls: 'boundary', defaultName: 'VPN Gateway', color: '#fb923c', Icon: Lock,
    allowedZones: ['enterprise', 'dmz']
  },
  {
    kind: 'switch', group: 'Network & Security', label: 'Managed Switch', subtitle: 'VLAN capable L2/L3',
    vendor: 'Generic', cls: 'switch', defaultName: 'Managed Switch', color: '#94a3b8', Icon: Network,
    allowedZones: ['enterprise', 'dmz', 'supervisory', 'control', 'field']
  },
  {
    kind: 'wonderware', group: 'Supervisory & HMI', label: 'Wonderware System Platform', subtitle: 'AVEVA application server',
    vendor: 'AVEVA (Wonderware)', cls: 'server', defaultName: 'Wonderware Server', color: '#38bdf8', Icon: Server,
    allowedZones: ['dmz', 'supervisory']
  },
  {
    kind: 'ifix', group: 'Supervisory & HMI', label: 'GE iFIX Node', subtitle: 'HMI / SCADA node',
    vendor: 'GE Vernova (Proficy iFIX)', cls: 'hmi', defaultName: 'iFIX Node', color: '#22d3ee', Icon: Monitor,
    allowedZones: ['supervisory', 'control']
  },
  {
    kind: 'siemens', group: 'Controllers', label: 'Siemens PLC', subtitle: 'S7-1500 / S7-1200 class',
    vendor: 'Siemens', cls: 'plc', defaultName: 'Siemens PLC', color: '#34d399', Icon: Cpu,
    allowedZones: ['control']
  },
  {
    kind: 'allenbradley', group: 'Controllers', label: 'Allen-Bradley Controller', subtitle: 'ControlLogix / CompactLogix',
    vendor: 'Rockwell Automation', cls: 'plc', defaultName: 'Allen-Bradley PLC', color: '#a3e635', Icon: CircuitBoard,
    allowedZones: ['control']
  },
  {
    kind: 'fieldio', group: 'Other', label: 'Remote I/O / RTU', subtitle: 'Field instrumentation',
    vendor: 'Generic', cls: 'field', defaultName: 'Remote I/O', color: '#c084fc', Icon: Gauge,
    allowedZones: ['control', 'field']
  },
  {
    kind: 'enterprise', group: 'Other', label: 'Business LAN Host', subtitle: 'Office PC / IT server',
    vendor: 'Generic', cls: 'it', defaultName: 'Business Host', color: '#818cf8', Icon: Laptop,
    allowedZones: ['enterprise']
  }
]

export const EQUIPMENT_BY_KIND = Object.fromEntries(EQUIPMENT.map((e) => [e.kind, e]))
export const EQUIPMENT_GROUPS = [...new Set(EQUIPMENT.map((e) => e.group))]

/* ------------------------------------------------------------------ */
/* Protocol catalogue                                                  */
/*  encrypted: provides confidentiality natively                       */
/*  risky: legacy / lateral-movement-prone protocol                    */
/* ------------------------------------------------------------------ */
export const PROTOCOLS = {
  opcua: { id: 'opcua', label: 'OPC UA (Sign & Encrypt)', port: '4840', encrypted: true, risky: false },
  cipsec: { id: 'cipsec', label: 'CIP Security', port: '2221', encrypted: true, risky: false },
  s7plus: { id: 's7plus', label: 'S7CommPlus + TLS', port: '102', encrypted: true, risky: false },
  mqtts: { id: 'mqtts', label: 'MQTT over TLS', port: '8883', encrypted: true, risky: false },
  https: { id: 'https', label: 'HTTPS', port: '443', encrypted: true, risky: false },
  ssh: { id: 'ssh', label: 'SSH', port: '22', encrypted: true, risky: false },
  ipsec: { id: 'ipsec', label: 'IPsec VPN Tunnel', port: '500/4500', encrypted: true, risky: false },
  modbus: { id: 'modbus', label: 'Modbus TCP', port: '502', encrypted: false, risky: false },
  dnp3: { id: 'dnp3', label: 'DNP3', port: '20000', encrypted: false, risky: false },
  enip: { id: 'enip', label: 'EtherNet/IP (CIP)', port: '44818', encrypted: false, risky: false },
  s7: { id: 's7', label: 'S7comm (classic)', port: '102', encrypted: false, risky: false },
  suitelink: { id: 'suitelink', label: 'Wonderware SuiteLink', port: '5413', encrypted: false, risky: false },
  sql: { id: 'sql', label: 'SQL Server (TDS)', port: '1433', encrypted: false, risky: false },
  opcdcom: { id: 'opcdcom', label: 'OPC Classic (DCOM)', port: '135 + dynamic', encrypted: false, risky: true },
  smb: { id: 'smb', label: 'SMB / File Share', port: '445', encrypted: false, risky: true },
  rdp: { id: 'rdp', label: 'RDP', port: '3389', encrypted: true, risky: true }
}

export const PROTOCOL_LIST = Object.values(PROTOCOLS)
