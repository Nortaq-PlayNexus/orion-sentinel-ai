import { describe, it, expect } from 'vitest'
import { spawnAnomaly, seedInitialAnomalies } from './engine'

describe('spawnAnomaly', () => {
  it('produces a well-formed anomaly', () => {
    const a = spawnAnomaly({ confidence: 90 })
    expect(a.id).toMatch(/^ORION-\d{4}$/)
    expect(a.lat).toBeGreaterThanOrEqual(-90)
    expect(a.lat).toBeLessThanOrEqual(90)
    expect(a.lon).toBeGreaterThanOrEqual(-180)
    expect(a.lon).toBeLessThanOrEqual(180)
    expect(a.confidence).toBeGreaterThan(0)
    expect(a.confidence).toBeLessThanOrEqual(100)
    expect(a.severity).toBeGreaterThan(0)
    expect(a.severity).toBeLessThanOrEqual(1)
    expect(a.explanations.length).toBeGreaterThan(0)
    expect(a.agents.length).toBeGreaterThan(0)
    expect(a.sources.length).toBeGreaterThan(0)
    expect(Number.isNaN(new Date(a.timeDetected).getTime())).toBe(false)
  })

  it('honours an explicit type override', () => {
    const a = spawnAnomaly({ type: 'ATMOSPHERIC_UAP', confidence: 88 })
    expect(a.type).toBe('ATMOSPHERIC_UAP')
    expect(a.vector).not.toBeNull()
    expect(a.speed).toBeGreaterThan(0)
  })

  it('honours provided coordinates', () => {
    const a = spawnAnomaly({ coords: { lat: 42, lon: -100 } })
    expect(a.lat).toBe(42)
    expect(a.lon).toBe(-100)
  })

  it('generates unique identifiers', () => {
    const ids = new Set(Array.from({ length: 5 }, () => spawnAnomaly().id))
    expect(ids.size).toBe(5)
  })
})

describe('seedInitialAnomalies', () => {
  it('returns ten seed events', () => {
    expect(seedInitialAnomalies()).toHaveLength(10)
  })
})
