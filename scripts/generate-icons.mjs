import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const pub = (f) => path.join(here, '..', 'public', f)
const svg = await readFile(pub('favicon.svg'))

const icons = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180]
]
for (const [file, size] of icons) {
  await sharp(svg, { density: 600 }).resize(size, size).png().toFile(pub(file))
  console.log('created', file)
}

const ogBase = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0b1220"/>
  <rect x="0" y="590" width="1200" height="40" fill="#22d3ee" opacity="0.15"/>
  <text x="400" y="290" font-family="sans-serif" font-size="68" font-weight="700" fill="#f1f5f9">SCADAShield</text>
  <text x="400" y="370" font-family="sans-serif" font-size="48" fill="#22d3ee">Network Planner</text>
  <text x="400" y="440" font-family="sans-serif" font-size="28" fill="#94a3b8">Purdue Model segmentation + IEC 62443 validation</text>
</svg>`
const logo = await sharp(svg, { density: 600 }).resize(260, 260).png().toBuffer()
await sharp(Buffer.from(ogBase)).composite([{ input: logo, left: 100, top: 185 }]).png().toFile(pub('og-image.png'))
console.log('created og-image.png')
