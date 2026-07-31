import { describe, it, expect } from 'vitest'
import { fbm, landFactor } from './textures'

describe('fbm', () => {
  it('produces values within [0, 1]', () => {
    for (let i = 0; i < 100; i++) {
      const v = fbm(Math.random() * 100, Math.random() * 100)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})

describe('landFactor', () => {
  it('produces values within [0, 1]', () => {
    for (let i = 0; i < 200; i++) {
      const v = landFactor(Math.random() * 180 - 90, Math.random() * 360 - 180)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('recognises known landmasses and open ocean', () => {
    expect(landFactor(52, -100)).toBeGreaterThan(0.5)
    expect(landFactor(-25, 135)).toBeGreaterThan(0.5)
    expect(landFactor(0, -140)).toBeLessThan(0.15)
  })
})
