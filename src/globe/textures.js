import * as THREE from 'three'

let seed = 1337
export function setNoiseSeed(s) {
  seed = s
}

function hash2(x, y) {
  let h = seed ^ (x * 374761393) ^ (y * 668265263)
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function valueNoise(x, y) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  const ux = xf * xf * (3 - 2 * xf)
  const uy = yf * yf * (3 - 2 * yf)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}

export function fbm(x, y, octaves = 5, lacunarity = 2, gain = 0.5) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq)
    norm += amp
    amp *= gain
    freq *= lacunarity
  }
  return sum / norm
}

const CONTINENTS = [
  { lat: 52, lon: -102, w: 46, h: 38 },
  { lat: 64, lon: -44, w: 18, h: 12 },
  { lat: 70, lon: -30, w: 12, h: 8 },
  { lat: -16, lon: -62, w: 17, h: 34 },
  { lat: 48, lon: 22, w: 14, h: 14 },
  { lat: 6, lon: 20, w: 22, h: 32 },
  { lat: 56, lon: 90, w: 46, h: 26 },
  { lat: 24, lon: 79, w: 12, h: 12 },
  { lat: 4, lon: 105, w: 15, h: 8 },
  { lat: -24, lon: 134, w: 20, h: 17 },
  { lat: -84, lon: 30, w: 130, h: 12 },
  { lat: 48, lon: -58, w: 20, h: 10 },
  { lat: 60, lon: -150, w: 12, h: 8 },
  { lat: -8, lon: 125, w: 14, h: 8 },
]

export function landFactor(lat, lon) {
  let score = 0
  for (const c of CONTINENTS) {
    const dLat = (lat - c.lat) / c.h
    const dLon = (lon - c.lon) / c.w
    const d = dLat * dLat + dLon * dLon
    if (d < 1.2) {
      const base = 1 - d
      const edge = fbm(lon * 0.05, lat * 0.05, 4)
      score = Math.max(score, base * (0.55 + 0.5 * edge))
    }
  }
  return Math.max(0, Math.min(1, score))
}

function latLonToUv(lat, lon) {
  const u = (lon + 180) / 360
  const v = 1 - (lat + 90) / 180
  return { u, v }
}

function createCanvas(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d') }
}

function makeTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

export function createEarthTextures() {
  const W = 2048
  const H = 1024
  const { canvas, ctx } = createCanvas(W, H)
  const img = ctx.createImageData(W, H)

  for (let y = 0; y < H; y++) {
    const lat = 90 - (y / H) * 180
    for (let x = 0; x < W; x++) {
      const lon = (x / W) * 360 - 180
      const land = landFactor(lat, lon)
      const i = (y * W + x) * 4
      if (land > 0.02) {
        const aridity = 1 - Math.min(1, Math.abs(lat) / 55)
        const veg = fbm(lon * 0.03 + 10, lat * 0.03 + 10, 5)
        let r, g, b
        if (lat > 60) {
          r = 235 + (1 - veg) * 15
          g = 240 + (1 - veg) * 10
          b = 245
        } else if (lat < -62) {
          r = 240
          g = 247
          b = 252
        } else {
          const mix = veg * 0.7 + aridity * 0.3
          r = 55 + mix * 140 + (1 - aridity) * 20
          g = 95 + mix * 115
          b = 40 + mix * 70
        }
        const shade = 0.82 + 0.18 * fbm(lon * 0.5 + 30, lat * 0.5 + 30, 3)
        img.data[i] = r * shade
        img.data[i + 1] = g * shade
        img.data[i + 2] = b * shade
        img.data[i + 3] = 255
      } else {
        const depth = 1 - land
        const d = Math.min(1, depth * 1.15)
        const r = 4 + d * 10
        const g = 22 + d * 42
        const b = 66 + d * 96
        const shade = 0.9 + 0.1 * fbm(lon * 0.35 + 5, lat * 0.35 + 5, 4)
        img.data[i] = r * shade
        img.data[i + 1] = g * shade
        img.data[i + 2] = b * shade
        img.data[i + 3] = 255
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  return makeTexture(canvas)
}

export function createNightLights() {
  const W = 2048
  const H = 1024
  const { canvas, ctx } = createCanvas(W, H)
  const img = ctx.createImageData(W, H)

  const cities = [
    [-6.2, 106.8, 1.6],
    [35.6, 139.6, 1.8],
    [31.2, 121.4, 1.7],
    [39.9, 116.4, 1.6],
    [22.5, 114.0, 1.4],
    [19.0, 72.8, 1.5],
    [28.6, 77.2, 1.4],
    [34.0, -118.2, 1.5],
    [40.7, -74.0, 1.5],
    [51.5, -0.12, 1.3],
    [48.8, 2.3, 1.3],
    [55.7, 37.6, 1.3],
    [1.3, 103.8, 1.3],
    [37.5, 127.0, 1.4],
    [25.0, 121.5, 1.3],
    [-23.5, -46.6, 1.4],
    [30.0, 31.2, 1.1],
    [31.6, 74.8, 1.2],
    [-33.8, 151.2, 1.2],
    [52.5, 13.4, 1.1],
    [45.4, -75.7, 1.1],
    [-1.28, 36.8, 1.0],
    [41.9, -87.6, 1.2],
    [29.7, -95.3, 1.1],
    [33.7, -84.4, 1.1],
    [39.7, -105.0, 1.0],
    [47.6, -122.3, 1.1],
    [43.6, -79.4, 1.1],
    [6.5, 3.4, 1.0],
    [23.8, 90.4, 1.0],
    [13.7, 100.5, 1.2],
    [-12.0, -77.0, 1.1],
    [35.8, 140.4, 1.2],
    [36.6, 127.2, 1.1],
    [50.0, 36.2, 1.0],
    [46.9, 7.5, 0.9],
  ]

  for (let i = 0; i < cities.length; i++) {
    const [clat, clon, mag] = cities[i]
    const { u, v } = latLonToUv(clat, clon)
    const px = Math.floor(u * W)
    const py = Math.floor(v * H)
    const rad = Math.floor(W * 0.004 * mag)
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        const nx = (px + dx + W) % W
        const ny = py + dy
        if (ny < 0 || ny >= H) continue
        const dist = Math.hypot(dx, dy) / rad
        if (dist > 1) continue
        const intensity = (1 - dist) * 0.7 + 0.3 * fbm(nx * 0.1, ny * 0.1, 3)
        const i2 = (ny * W + nx) * 4
        const warm = 0.6 + 0.4 * Math.random()
        img.data[i2] = 255 * intensity * 0.85
        img.data[i2 + 1] = Math.min(255, 200 * intensity * warm)
        img.data[i2 + 2] = Math.min(255, 120 * intensity * warm)
        img.data[i2 + 3] = 255
      }
    }
  }

  for (let y = 0; y < H; y++) {
    const lat = 90 - (y / H) * 180
    for (let x = 0; x < W; x++) {
      const lon = (x / W) * 360 - 180
      const land = landFactor(lat, lon)
      const i = (y * W + x) * 4
      if (land < 0.04) {
        const glow = fbm(lon * 0.04 + 100, lat * 0.04 + 100, 4) * (land < 0.0 ? 0.06 : 0)
        img.data[i] = Math.max(img.data[i], glow * 80)
        img.data[i + 1] = Math.max(img.data[i + 1], glow * 90)
        img.data[i + 2] = Math.max(img.data[i + 2], glow * 110)
        img.data[i + 3] = 255
      } else if (land < 0.12) {
        const coast = fbm(lon * 0.08 + 7, lat * 0.08 + 7, 4)
        if (coast > 0.62) {
          img.data[i] = Math.max(img.data[i], 90)
          img.data[i + 1] = Math.max(img.data[i + 1], 110)
          img.data[i + 2] = Math.max(img.data[i + 2], 130)
        }
      }
    }
  }

  ctx.putImageData(img, 0, 0)
  const tex = makeTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function createCloudTexture() {
  const W = 2048
  const H = 1024
  const { canvas, ctx } = createCanvas(W, H)
  const img = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    const lat = 90 - (y / H) * 180
    for (let x = 0; x < W; x++) {
      const lon = (x / W) * 360 - 180
      const band = 0.35 + 0.3 * Math.sin((lat + 10) * (Math.PI / 180) * 3)
      const n = fbm(lon * 0.045 + 300, lat * 0.045 + 300, 5)
      let c = (n - (1 - band)) * 3.2
      if (c < 0) c = 0
      c = Math.min(1, c)
      const i = (y * W + x) * 4
      const bright = 235 + 20 * fbm(lon * 0.2 + 40, lat * 0.2 + 40, 3)
      img.data[i] = bright
      img.data[i + 1] = bright
      img.data[i + 2] = bright
      img.data[i + 3] = c * 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = makeTexture(canvas)
  return tex
}

export function createBathymetryTexture() {
  const W = 2048
  const H = 1024
  const { canvas, ctx } = createCanvas(W, H)
  const img = ctx.createImageData(W, H)
  for (let y = 0; y < H; y++) {
    const lat = 90 - (y / H) * 180
    for (let x = 0; x < W; x++) {
      const lon = (x / W) * 360 - 180
      const land = landFactor(lat, lon)
      const i = (y * W + x) * 4
      if (land > 0.02) {
        const shade = 0.5 + 0.3 * fbm(lon * 0.5 + 60, lat * 0.5 + 60, 3)
        img.data[i] = 30 + 40 * shade
        img.data[i + 1] = 34 + 30 * shade
        img.data[i + 2] = 40 + 30 * shade
        img.data[i + 3] = 255
      } else {
        const depth = fbm(lon * 0.05 + 5, lat * 0.05 + 5, 5)
        const troughs = 0.25 + 0.75 * depth
        const shelf = 1 - Math.min(1, (1 - land) * 3.2)
        const eff = Math.max(shelf * 0.9, troughs)
        let r, g, b
        if (eff > 0.92) {
          r = 10
          g = 22
          b = 44
        } else if (eff > 0.7) {
          r = 14
          g = 38
          b = 82
        } else if (eff > 0.45) {
          r = 20
          g = 58
          b = 128
        } else if (eff > 0.25) {
          r = 34
          g = 96
          b = 176
        } else {
          r = 64
          g = 148
          b = 214
        }
        const ridge = Math.abs(fbm(lon * 0.09 + 500, lat * 0.09 + 500, 5) - 0.55) < 0.02 ? 1.35 : 1
        img.data[i] = Math.min(255, r * ridge)
        img.data[i + 1] = Math.min(255, g * ridge)
        img.data[i + 2] = Math.min(255, b * ridge)
        img.data[i + 3] = 255
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = makeTexture(canvas)
  return tex
}
