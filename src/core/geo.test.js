import { describe, it, expect } from 'vitest'
import { latLonToVec3, vec3ToLatLon, fmtLatLon, haversineKm } from './geo'

describe('latLonToVec3', () => {
  it('returns a vector with the requested radius', () => {
    for (const [lat, lon] of [
      [0, 0],
      [45, -120],
      [-33, 151],
      [80, 20],
    ]) {
      const v = latLonToVec3(lat, lon, 1)
      expect(Math.abs(v.length() - 1)).toBeLessThan(1e-9)
    }
  })

  it('places the north pole on the +Y axis', () => {
    const v = latLonToVec3(90, 0, 1)
    expect(v.x).toBeCloseTo(0, 6)
    expect(v.y).toBeCloseTo(1, 6)
    expect(v.z).toBeCloseTo(0, 6)
  })

  it('round-trips through vec3ToLatLon', () => {
    for (const [lat, lon] of [
      [12.5, -77.25],
      [-35, 149],
      [89.9, 0],
      [0, 180],
      [-0.5, -180],
    ]) {
      const back = vec3ToLatLon(latLonToVec3(lat, lon, 2))
      expect(Math.abs(back.lat - lat)).toBeLessThan(1e-6)
      const dLon = Math.abs(back.lon - lon) % 360
      expect(Math.min(dLon, 360 - dLon)).toBeLessThan(1e-6)
    }
  })
})

describe('fmtLatLon', () => {
  it('formats coordinates with hemisphere suffixes', () => {
    expect(fmtLatLon(12.345, -77.5)).toMatch(/12\.35° N/)
    expect(fmtLatLon(-33.8, 151.2)).toMatch(/33\.80° S/)
  })
})

describe('haversineKm', () => {
  it('returns zero for identical coordinates', () => {
    expect(haversineKm(10, 20, 10, 20)).toBe(0)
  })

  it('approximates the New York–London great-circle distance', () => {
    const km = haversineKm(40.7128, -74.006, 51.5074, -0.1278)
    expect(km).toBeGreaterThan(5500)
    expect(km).toBeLessThan(5600)
  })
})
