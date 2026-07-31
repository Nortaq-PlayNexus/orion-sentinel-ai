import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './store'

beforeEach(() => {
  useStore.setState({
    anomalies: [],
    feed: [],
    selectedId: null,
    activeTab: 'ai',
  })
})

describe('store', () => {
  it('toggles visual layers', () => {
    const before = useStore.getState().layers.satellites
    useStore.getState().toggleLayer('satellites')
    expect(useStore.getState().layers.satellites).toBe(!before)
  })

  it('adds an anomaly and prepends a feed entry', () => {
    useStore.getState().addAnomaly({
      id: 'ORION-T1',
      headline: 'Test signal',
      type: 'THERMAL_SIGNATURE',
      confidence: 64,
      lat: 10,
      lon: -20,
      timeDetected: new Date().toISOString(),
    })
    const s = useStore.getState()
    expect(s.anomalies).toHaveLength(1)
    expect(s.feed).toHaveLength(1)
    expect(s.feed[0].id).toBe('ORION-T1')
    expect(s.feed[0].label).toBe('Test signal')
  })

  it('caps the anomaly and feed lists', () => {
    for (let i = 0; i < 140; i++) {
      useStore.getState().addAnomaly({
        id: `A${i}`,
        headline: `h${i}`,
        type: 'GEOMETRIC_FORMATION',
        confidence: 50,
        lat: 0,
        lon: 0,
        timeDetected: new Date().toISOString(),
      })
    }
    expect(useStore.getState().anomalies.length).toBeLessThanOrEqual(120)
    expect(useStore.getState().feed.length).toBeLessThanOrEqual(200)
  })

  it('selecting an anomaly switches to the event tab', () => {
    useStore.getState().setTab('ai')
    useStore.getState().selectAnomaly('ORION-T1')
    expect(useStore.getState().selectedId).toBe('ORION-T1')
    expect(useStore.getState().activeTab).toBe('event')
  })

  it('marks boot complete at 100% progress', () => {
    useStore.getState().setBoot(50)
    expect(useStore.getState().booted).toBe(false)
    useStore.getState().setBoot(100)
    expect(useStore.getState().booted).toBe(true)
  })
})
