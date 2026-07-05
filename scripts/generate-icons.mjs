// Generates PWA icons with zero dependencies (Node built-ins only).
// Draws a simple mountain scene on a green background and writes valid PNGs.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// --- tiny PNG encoder ------------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// --- scene -----------------------------------------------------------------
function render(size) {
  const buf = Buffer.alloc(size * size * 4)
  const skyTop = [11, 61, 46] // #0b3d2e
  const skyBot = [22, 163, 74] // #16a34a
  const rock = [200, 230, 210]
  const snow = [240, 253, 244]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      let r = Math.round(skyTop[0] * (1 - v) + skyBot[0] * v)
      let g = Math.round(skyTop[1] * (1 - v) + skyBot[1] * v)
      let b = Math.round(skyTop[2] * (1 - v) + skyBot[2] * v)
      const ridge = Math.min(0.42 + 1.15 * Math.abs(u - 0.34), 0.52 + 1.3 * Math.abs(u - 0.68))
      if (v > ridge) {
        if (v < ridge + 0.1) {
          r = snow[0]
          g = snow[1]
          b = snow[2]
        } else {
          r = rock[0]
          g = rock[1]
          b = rock[2]
        }
      }
      const i = (y * size + x) * 4
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
      buf[i + 3] = 255
    }
  }
  return buf
}

function writeIcon(name, size) {
  const png = encodePng(size, size, render(size))
  writeFileSync(join(publicDir, name), png)
  console.log(`wrote ${name} (${size}x${size}, ${png.length} bytes)`)
}

writeIcon('pwa-192x192.png', 192)
writeIcon('pwa-512x512.png', 512)
writeIcon('apple-touch-icon.png', 180)

// favicon as scalable SVG
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="5" fill="#16a34a"/>
  <path fill="#f0fdf4" d="M12 5l5.5 10h-3.2L12 10.6 9.7 15H6.5L12 5z"/>
  <path fill="#dcfce7" d="M3.5 20l3.4-6L10 20H3.5zm8.5 0l2.7-4.8L19.5 20H12z"/>
</svg>`
writeFileSync(join(publicDir, 'favicon.svg'), favicon)
console.log('wrote favicon.svg')
