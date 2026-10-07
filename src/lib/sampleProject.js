import { LANE_HEIGHT, createLaneNodes } from './catalog'

const NODE_Y_OFFSET = 85 // places a single row of nodes in the middle of a lane
const laneY = (laneIndex, offset = NODE_Y_OFFSET) => laneIndex * LANE_HEIGHT + offset

const mk = (id, kind, label, x, y, ip = '') => ({
  id,
  type: 'industrial',
  position: { x, y },
  data: { kind, label, ip }
})

const link = (id, source, sourceHandle, target, targetHandle, protocol, vpnTunnel = false) => ({
  id,
  source,
  sourceHandle,
  target,
  targetHandle,
  type: 'smoothstep',
  data: { protocol, vpnTunnel }
})

export const withLanes = (nodes) => [...createLaneNodes(), ...nodes]

/** Segmented reference architecture with zero findings. */
export function buildSecureReference() {
  const nodes = [
    mk('ent1', 'enterprise', 'Business Workstation', 200, laneY(0), '10.10.1.20'),
    mk('ent2', 'enterprise', 'Remote Engineer Laptop', 1160, laneY(0), 'dynamic'),

    mk('fw1', 'firewall', 'Enterprise/DMZ Firewall', 200, laneY(1), '10.20.0.1'),
    mk('wwinfo', 'wonderware', 'Wonderware Information Server', 520, laneY(1), '10.20.0.10'),
    mk('fw2', 'firewall', 'DMZ/Operations Firewall', 840, laneY(1), '10.20.0.2'),
    mk('vpn1', 'vpn', 'Remote Access VPN', 1160, laneY(1), '10.20.0.5'),

    mk('ww1', 'wonderware', 'Wonderware System Platform', 520, laneY(2), '10.30.0.10'),
    mk('sw1', 'switch', 'Supervisory Switch', 840, laneY(2), '10.30.0.2'),
    mk('ifix1', 'ifix', 'iFIX HMI 01', 1160, laneY(2), '10.30.0.21'),

    mk('fw3', 'firewall', 'Control Zone Firewall', 840, laneY(3, 15), '10.40.0.1'),
    mk('swc', 'switch', 'Control Switch', 840, laneY(3, 115), '10.40.0.2'),
    mk('plc1', 'siemens', 'Siemens S7-1500', 520, laneY(3, 115), '10.40.0.11'),
    mk('plc2', 'allenbradley', 'ControlLogix L83', 1160, laneY(3, 115), '10.40.0.12'),

    mk('io1', 'fieldio', 'Remote I/O Rack A', 520, laneY(4), '10.50.0.11'),
    mk('io2', 'fieldio', 'Remote I/O Rack B', 1160, laneY(4), '10.50.0.12')
  ]
  const edges = [
    link('e1', 'ent1', 'b', 'fw1', 't', 'https'),
    link('e2', 'fw1', 'r', 'wwinfo', 'l', 'opcua'),
    link('e3', 'wwinfo', 'r', 'fw2', 'l', 'opcua'),
    link('e4', 'ent2', 'b', 'vpn1', 't', 'ipsec'),
    link('e5', 'vpn1', 'l', 'fw2', 'r', 'https'),
    link('e6', 'fw2', 'b', 'sw1', 't', 'opcua'),
    link('e7', 'sw1', 'l', 'ww1', 'r', 'suitelink'),
    link('e8', 'sw1', 'r', 'ifix1', 'l', 'opcua'),
    link('e9', 'sw1', 'b', 'fw3', 't', 'opcua'),
    link('e10', 'fw3', 'b', 'swc', 't', 'cipsec'),
    link('e11', 'swc', 'l', 'plc1', 'r', 'enip'),
    link('e12', 'swc', 'r', 'plc2', 'l', 'enip'),
    link('e13', 'plc1', 'b', 'io1', 't', 'modbus'),
    link('e14', 'plc2', 'b', 'io2', 't', 'enip')
  ]
  return { nodes, edges }
}

/** Deliberately flawed flat network, useful to demo the validator. */
export function buildFlatNetwork() {
  const nodes = [
    mk('ent1', 'enterprise', 'Business Workstation', 200, laneY(0), '192.168.1.20'),
    mk('ent2', 'enterprise', 'Engineering Laptop', 1160, laneY(0), '192.168.1.45'),
    mk('fw1', 'firewall', 'Lonely Firewall', 840, laneY(1), '192.168.1.1'),
    mk('ww1', 'wonderware', 'Wonderware System Platform', 840, laneY(2), '192.168.1.60'),
    mk('sw1', 'switch', 'Flat Core Switch', 1160, laneY(2), '192.168.1.2'),
    mk('ifix1', 'ifix', 'iFIX HMI 01', 1480, laneY(2), '192.168.1.61'),
    mk('plc1', 'siemens', 'Siemens S7-1200', 200, laneY(3), '192.168.1.101'),
    mk('plc2', 'allenbradley', 'CompactLogix L33', 1160, laneY(3), '192.168.1.102'),
    mk('io1', 'fieldio', 'Remote I/O Rack A', 200, laneY(4), '192.168.1.151')
  ]
  const edges = [
    link('e1', 'ent1', 'b', 'plc1', 't', 's7'),
    link('e2', 'ent2', 'b', 'sw1', 't', 'rdp'),
    link('e3', 'fw1', 'b', 'ww1', 't', 'opcua'),
    link('e4', 'ww1', 'r', 'sw1', 'l', 'suitelink'),
    link('e5', 'sw1', 'r', 'ifix1', 'l', 'opcdcom'),
    link('e6', 'sw1', 'b', 'plc2', 't', 'enip'),
    link('e7', 'plc1', 'b', 'io1', 't', 'modbus')
  ]
  return { nodes, edges }
}

export const TEMPLATES = {
  secure: { label: 'Secure reference architecture', build: buildSecureReference },
  flat: { label: 'Flat network (insecure demo)', build: buildFlatNetwork },
  blank: { label: 'Blank canvas', build: () => ({ nodes: [], edges: [] }) }
}
