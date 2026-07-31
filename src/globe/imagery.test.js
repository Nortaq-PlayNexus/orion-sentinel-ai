import { describe, it, expect } from 'vitest'
import {
  webMercatorY,
  mercatorToLat,
  latLonToTile,
  tileBounds,
  zoomForPxPerDeg,
  regionTiles,
  computeRegion,
  surfacePxPerDeg,
  visibleCapHalfAngle,
  MAX_MERC_LAT,
} from './imagery'

describe('webMercatorY', () => {
  it('maps the equator to 0.5', () => {
    expect(webMercatorY(0)).toBeCloseTo(0.5, 6)
  })

  it('clamps to the mercator ±85.05 limit', () => {
    expect(webMercatorY(90)).toBeCloseTo(0, 3)
    expect(webMercatorY(-90)).toBeCloseTo(1, 3)
  })

  it('is monotonic decreasing', () => {
    const a = webMercatorY(60)
    const b = webMercatorY(0)
    const c = webMercatorY(-60)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
  })

  it('is the inverse of mercatorToLat', () => {
    for (const lat of [0, 30, -30, 60, -60, 84, -84]) {
      expect(mercatorToLat(webMercatorY(lat))).toBeCloseTo(lat, 3)
    }
  })

  it('matches the tiling convention at the edges', () => {
    expect(webMercatorY(MAX_MERC_LAT)).toBeCloseTo(0, 3)
  })
})

describe('latLonToTile', () => {
  it('places (0,0) at tile (2,2) at zoom 2', () => {
    const t = latLonToTile(0, 0, 2)
    expect(t.tx).toBe(2)
    expect(t.ty).toBe(2)
    expect(t.u).toBeCloseTo(0, 6)
    expect(t.v).toBeCloseTo(0, 6)
  })

  it('wraps longitude across the antimeridian', () => {
    const t = latLonToTile(0, 180, 2)
    expect(t.tx).toBe(0)
    expect(t.u).toBeCloseTo(0, 5)
  })

  it('produces fractional coordinates inside a tile', () => {
    const t = latLonToTile(0, 11.25, 2)
    expect(t.tx).toBe(2)
    expect(t.ty).toBe(2)
    expect(t.u).toBeGreaterThan(0)
    expect(t.u).toBeLessThan(1)
  })
})

describe('tileBounds', () => {
  it('covers the whole world at zoom 0', () => {
    const b = tileBounds(0, 0, 0)
    expect(b.west).toBe(-180)
    expect(b.east).toBe(180)
    expect(b.north).toBeCloseTo(MAX_MERC_LAT, 2)
    expect(b.south).toBeCloseTo(-MAX_MERC_LAT, 2)
  })

  it('splits evenly at zoom 1', () => {
    const b = tileBounds(1, 0, 0)
    expect(b.west).toBe(-180)
    expect(b.east).toBe(0)
    expect(b.north).toBeCloseTo(MAX_MERC_LAT, 2)
  })
})

describe('zoomForPxPerDeg', () => {
  it('matches tile density for a whole-tile-per-256px zoom', () => {
    expect(zoomForPxPerDeg((256 * 64) / 360)).toBe(6)
  })

  it('clamps to min/max zoom', () => {
    expect(zoomForPxPerDeg(0.0001, 3, 17)).toBe(3)
    expect(zoomForPxPerDeg(1e12, 3, 17)).toBe(17)
  })
})

describe('regionTiles', () => {
  it('returns the tiles covering a small box', () => {
    const tiles = regionTiles(2, 10, -10, -20, 20)
    expect(tiles.length).toBeGreaterThan(0)
    for (const t of tiles) {
      expect(t.z).toBe(2)
      expect(t.x).toBeGreaterThanOrEqual(0)
      expect(t.x).toBeLessThan(4)
      expect(t.y).toBeGreaterThanOrEqual(0)
      expect(t.y).toBeLessThan(4)
    }
  })

  it('handles antimeridian wrapping', () => {
    const tiles = regionTiles(2, 10, -10, 170, -170)
    expect(tiles.length).toBeGreaterThan(0)
    const xs = new Set(tiles.map((t) => t.x))
    expect(xs.has(0)).toBe(true)
    expect(xs.has(3)).toBe(true)
  })
})

describe('computeRegion', () => {
  it('returns a bounded canvas and sane lat/lon box', () => {
    const r = computeRegion(0, 0, 20, 3)
    expect(r.z).toBeGreaterThan(3)
    expect(r.W).toBeGreaterThanOrEqual(64)
    expect(r.W).toBeLessThanOrEqual(4096)
    expect(r.H).toBeGreaterThanOrEqual(64)
    expect(r.H).toBeLessThanOrEqual(2048)
    expect(r.topLat).toBeGreaterThan(r.bottomLat)
    expect(r.eastLon - r.westLon).toBeGreaterThan(0)
    expect(r.westLon).toBeLessThanOrEqual(0)
    expect(r.eastLon).toBeGreaterThanOrEqual(0)
  })

  it('stays within mercator latitude bounds', () => {
    const r = computeRegion(89, 0, 50, 3)
    expect(r.topLat).toBeLessThanOrEqual(90)
    expect(r.bottomLat).toBeGreaterThanOrEqual(-90)
  })

  it('covers the center longitude even near the antimeridian', () => {
    const r = computeRegion(0, 179, 30, 3)
    expect(r.westLon).toBeLessThanOrEqual(179)
    expect(r.eastLon).toBeGreaterThanOrEqual(179)
  })
})

describe('view geometry', () => {
  it('computes the near-surface cap: smaller up close, capped at the limb far away', () => {
    const far = visibleCapHalfAngle(9, (45 / 2) * (Math.PI / 180))
    const near = visibleCapHalfAngle(1.35, (45 / 2) * (Math.PI / 180))
    expect(far).toBeCloseTo(Math.PI / 2, 5)
    expect(near).toBeLessThan(far)
    expect(near).toBeGreaterThan(0)
    expect(near).toBeLessThan(Math.PI / 2)
  })

  it('computes increasing surface pixel density as the camera approaches', () => {
    const far = surfacePxPerDeg(4, 1000)
    const near = surfacePxPerDeg(1.35, 1000)
    expect(near).toBeGreaterThan(far)
  })
})
