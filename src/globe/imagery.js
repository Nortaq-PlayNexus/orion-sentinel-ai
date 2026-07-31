import * as THREE from 'three'

export const TILE_SIZE = 256
export const ESRI_TILE_URL = (z, x, y) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
export const IMAGERY_ATTRIBUTION = 'Imagery © Esri, Maxar, Earthstar Geographics'
export const MAX_MERC_LAT = 85.05

const RAD = Math.PI / 180

/* ------------------------------- Projection -------------------------------- */

export function webMercatorY(latDeg) {
  const lat = THREE.MathUtils.clamp(latDeg, -MAX_MERC_LAT, MAX_MERC_LAT) * RAD
  return 0.5 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / (Math.PI * 2)
}

export function mercatorToLat(y01) {
  const n = Math.PI * (1 - 2 * THREE.MathUtils.clamp(y01, 0, 1))
  return Math.atan(Math.sinh(n)) / RAD
}

export function latLonToTile(latDeg, lonDeg, z) {
  const N = 2 ** z
  const xm = ((lonDeg + 180) / 360) * N
  const ym = webMercatorY(latDeg) * N
  const ty = Math.floor(THREE.MathUtils.clamp(ym, 0, N - 1e-6))
  const rawTx = Math.floor(xm)
  const tx = ((rawTx % N) + N) % N
  return { tx, ty, u: xm - rawTx, v: ym - ty }
}

export function tileBounds(z, x, y) {
  const N = 2 ** z
  const west = (x / N) * 360 - 180
  const east = ((x + 1) / N) * 360 - 180
  const north = mercatorToLat(y / N)
  const south = mercatorToLat((y + 1) / N)
  return { west, east, north, south }
}

export function zoomForPxPerDeg(pxPerDeg, minZ = 3, maxZ = 17) {
  const z = Math.ceil(Math.log2((pxPerDeg * 360) / TILE_SIZE))
  return Math.max(minZ, Math.min(maxZ, z))
}

export function regionTiles(z, topLat, bottomLat, westLon, eastLon) {
  const N = 2 ** z
  const x0 = Math.floor((((((westLon + 180) / 360) * N) % N) + N) % N)
  const x1 = Math.floor((((((eastLon + 180) / 360) * N) % N) + N) % N)
  const y0 = Math.floor(THREE.MathUtils.clamp(webMercatorY(topLat) * N, 0, N - 1e-6))
  const y1 = Math.floor(THREE.MathUtils.clamp(webMercatorY(bottomLat) * N, 0, N - 1e-6))
  const tiles = []
  for (let y = y0; y <= y1; y++) {
    if (x1 >= x0) {
      for (let x = x0; x <= x1; x++) tiles.push({ z, x, y })
    } else {
      for (let x = x0; x < N; x++) tiles.push({ z, x, y })
      for (let x = 0; x <= x1; x++) tiles.push({ z, x, y })
    }
  }
  return tiles
}

/**
 * Adaptive detail region for the visible cap around (centerLat, centerLon).
 * Keeps the tile fetch count bounded while zooming: the covered box shrinks as
 * the required tile zoom grows, and grows towards ~60° when far away.
 */
export function computeRegion(centerLat, centerLon, pxPerDeg, baseZ, budget = 100, minSide = 8) {
  const z = zoomForPxPerDeg(pxPerDeg, baseZ + 1)
  const N = 2 ** z
  const tileDeg = 360 / N
  const cosLat = Math.max(0.25, Math.abs(Math.cos(centerLat * RAD)))
  const lonNeed = Math.min(170, 60 / cosLat)
  const widthTiles = Math.max(
    minSide,
    Math.min(Math.ceil(lonNeed / tileDeg), Math.floor(Math.sqrt(budget))),
  )
  const maxRows = Math.max(minSide, Math.floor(budget / widthTiles))
  const mercCenter = webMercatorY(centerLat)
  const y0 = Math.max(0, mercCenter - maxRows / 2 / N)
  const y1 = Math.min(1, mercCenter + maxRows / 2 / N)
  const topLat = mercatorToLat(y0)
  const bottomLat = mercatorToLat(y1)
  const lonSpan = widthTiles * tileDeg
  const dens = Math.min(pxPerDeg, (TILE_SIZE * N) / 360)
  const W = Math.max(64, Math.min(4096, Math.round(lonSpan * dens)))
  const H = Math.max(64, Math.min(2048, Math.round((topLat - bottomLat) * dens)))
  return {
    z,
    westLon: centerLon - lonSpan / 2,
    eastLon: centerLon + lonSpan / 2,
    topLat,
    bottomLat,
    W,
    H,
  }
}

export function visibleCapHalfAngle(cameraDist, halfFovRad) {
  const d = Math.max(1.0001, cameraDist)
  const c = Math.cos(halfFovRad)
  const disc = d * d * c * c - (d * d - 1)
  if (disc <= 0) return Math.PI / 2
  const t = d * c - Math.sqrt(disc)
  const pz = d - t * c
  return Math.acos(Math.max(-1, Math.min(1, pz)))
}

export function surfacePxPerDeg(cameraDist, focalPx) {
  return (focalPx / Math.max(0.001, cameraDist - 1)) * RAD
}

/* ------------------------------- Provider ---------------------------------- */

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w))
  canvas.height = Math.max(1, Math.round(h))
  return canvas
}

function createTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

const yieldNow = () => new Promise((r) => setTimeout(r, 0))

export function createImageryProvider(opts = {}) {
  const baseZ = opts.baseZ ?? 3
  const baseW = opts.baseW ?? 2048
  const baseH = opts.baseH ?? 1024
  const chunkRows = opts.chunkRows ?? 24
  const maxTiles = opts.maxTiles ?? 640
  const tileUrl = opts.tileUrl ?? ESRI_TILE_URL
  const onOffline = opts.onOffline ?? (() => {})

  const tileCache = new Map()
  let offline = false
  let disposed = false
  let reqSeq = 0

  const baseCanvas = makeCanvas(baseW, baseH)
  const baseCtx = baseCanvas.getContext('2d')
  baseCtx.fillStyle = '#0a1a2e'
  baseCtx.fillRect(0, 0, baseW, baseH)
  const baseTexture = createTexture(baseCanvas)

  const detailCanvas = makeCanvas(2, 2)
  const detailTexture = createTexture(detailCanvas)
  const detailRect = { u0: 0, v0: 0, u1: -1, v1: -1 }
  let detailActive = false

  function loadTile(z, x, y) {
    const key = z + '/' + x + '/' + y
    const hit = tileCache.get(key)
    if (hit) return Promise.resolve(hit)
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      let done = false
      const timer = setTimeout(() => {
        if (!done) {
          done = true
          reject(new Error('tile timeout ' + key))
        }
      }, 20000)
      img.onload = () => {
        if (done) return
        done = true
        clearTimeout(timer)
        const c = makeCanvas(TILE_SIZE, TILE_SIZE)
        const ctx = c.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const data = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE)
        tileCache.set(key, data)
        if (tileCache.size > maxTiles) {
          const oldest = tileCache.keys().next().value
          tileCache.delete(oldest)
        }
        resolve(data)
      }
      img.onerror = () => {
        if (!done) {
          done = true
          clearTimeout(timer)
          reject(new Error('tile load failed ' + key))
        }
      }
      img.src = tileUrl(z, x, y)
    })
  }

  function sampleBilinear(tiles, tileRows, tileCols, col, row, fu, fv, out, o) {
    const c0 = Math.min(tileCols - 1, Math.max(0, col))
    const c1 = Math.min(tileCols - 1, c0 + 1)
    const r0 = Math.min(tileRows - 1, Math.max(0, row))
    const r1 = Math.min(tileRows - 1, r0 + 1)
    const t00 = tiles[r0 * tileCols + c0]
    const t10 = tiles[r0 * tileCols + c1]
    const t01 = tiles[r1 * tileCols + c0]
    const t11 = tiles[r1 * tileCols + c1]
    if (!t00 || !t10 || !t01 || !t11) {
      out[o + 3] = 0
      return
    }
    const x0 = (fu * TILE_SIZE) | 0
    const y0 = (fv * TILE_SIZE) | 0
    const x1 = Math.min(255, x0 + 1)
    const y1 = Math.min(255, y0 + 1)
    const uf = fu * TILE_SIZE - x0
    const vf = fv * TILE_SIZE - y0
    const i00 = (y0 * TILE_SIZE + x0) * 4
    const i10 = (y0 * TILE_SIZE + x1) * 4
    const i01 = (y1 * TILE_SIZE + x0) * 4
    const i11 = (y1 * TILE_SIZE + x1) * 4
    const d00 = t00.data
    const d10 = t10.data
    const d01 = t01.data
    const d11 = t11.data
    for (let ch = 0; ch < 3; ch++) {
      const top = d00[i00 + ch] + (d10[i10 + ch] - d00[i00 + ch]) * uf
      const bot = d01[i01 + ch] + (d11[i11 + ch] - d01[i01 + ch]) * uf
      out[o + ch] = top + (bot - top) * vf
    }
    out[o + 3] = 255
  }

  async function reproject(ctx, params, seq, onChunk) {
    const { W, H, topLat, bottomLat, westLon, eastLon, z } = params
    const N = 2 ** z
    const lonPerPx = (eastLon - westLon) / W
    const latPerPx = (topLat - bottomLat) / H

    const xStart = ((westLon + 180) / 360) * N
    const xEnd = ((eastLon + 180) / 360) * N
    const yStart = Math.max(0, webMercatorY(topLat) * N)
    const yEnd = Math.min(N - 1e-6, webMercatorY(bottomLat) * N)
    const tx0 = Math.floor(xStart)
    const tx1 = Math.floor(xEnd)
    const ty0 = Math.floor(yStart)
    const ty1 = Math.floor(yEnd)
    const tileCols = tx1 - tx0 + 1
    const tileRows = ty1 - ty0 + 1

    const tileKey = (tx, ty) => z + '/' + (((tx % N) + N) % N) + '/' + ty
    const keys = new Set()
    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) keys.add(tileKey(tx, ty))

    const results = await Promise.allSettled(
      [...keys].map((k) => {
        const [z2, xs, ys] = k.split('/')
        return loadTile(+z2, +xs, +ys)
      }),
    )
    if (disposed || seq !== reqSeq) return null
    let failed = 0
    for (const r of results) if (r.status === 'rejected') failed++
    const total = results.length
    if (total > 0 && failed / total > 0.7) {
      offline = true
      onOffline()
      return null
    }

    const dataMap = new Map()
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') dataMap.set([...keys][i], r.value)
    })

    const tiles = new Array(tileRows * tileCols)
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        tiles[(ty - ty0) * tileCols + (tx - tx0)] = dataMap.get(tileKey(tx, ty))
      }
    }

    const img = ctx.createImageData(W, H)
    const out = img.data
    for (let y = 0; y < H; y++) {
      const lat = topLat - y * latPerPx
      const merY = webMercatorY(lat) * N
      const ty = Math.floor(merY)
      const fv = merY - ty
      const row = ty - ty0
      const outRow = y * W * 4
      for (let x = 0; x < W; x++) {
        const lon = westLon + x * lonPerPx
        const xm = ((lon + 180) / 360) * N
        const rawTx = Math.floor(xm)
        const col = rawTx - tx0
        sampleBilinear(tiles, tileRows, tileCols, col, row, xm - rawTx, fv, out, outRow + x * 4)
      }
      if (y % chunkRows === chunkRows - 1 && y < H - 1) {
        ctx.putImageData(img, 0, 0, 0, y - chunkRows + 1, W, chunkRows)
        if (onChunk) onChunk(y + 1)
        if (disposed || seq !== reqSeq) return null
        await yieldNow()
      }
    }
    ctx.putImageData(img, 0, 0)
    return img
  }

  const basePromise = (async () => {
    const seq = ++reqSeq
    const img = await reproject(
      baseCtx,
      { W: baseW, H: baseH, topLat: 90, bottomLat: -90, westLon: -180, eastLon: 180, z: baseZ },
      seq,
      () => {
        baseTexture.needsUpdate = true
      },
    )
    if (img) baseTexture.needsUpdate = true
    return offline
  })()

  return {
    baseTexture,
    getDetailTexture: () => detailTexture,
    getDetailRect: () => ({ ...detailRect }),
    isDetailActive: () => detailActive,
    isOffline: () => offline,
    baseReady: basePromise,

    async requestDetail({ centerLat, centerLon, pxPerDeg }) {
      if (offline || disposed) return
      const seq = ++reqSeq
      const region = computeRegion(centerLat, centerLon, pxPerDeg, baseZ)
      if (region.z <= baseZ) {
        detailActive = false
        return
      }
      detailActive = true
      const canvas = makeCanvas(region.W, region.H)
      const ctx = canvas.getContext('2d')
      const img = await reproject(ctx, region, seq)
      if (!img || disposed || seq !== reqSeq) return
      detailCanvas.width = region.W
      detailCanvas.height = region.H
      const dctx = detailCanvas.getContext('2d')
      dctx.putImageData(img, 0, 0)
      detailTexture.image = detailCanvas
      detailTexture.needsUpdate = true
      detailRect.u0 = (region.westLon + 180) / 360
      detailRect.v0 = 1 - (region.topLat + 90) / 180
      detailRect.u1 = (region.eastLon + 180) / 360
      detailRect.v1 = 1 - (region.bottomLat + 90) / 180
    },

    dispose() {
      disposed = true
      reqSeq++
      baseTexture.dispose()
      detailTexture.dispose()
    },
  }
}
