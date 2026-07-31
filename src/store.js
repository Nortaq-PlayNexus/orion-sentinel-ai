import { create } from 'zustand'

export const useStore = create((set) => ({
  booted: false,
  bootProgress: 0,

  layers: {
    satellites: true,
    clouds: true,
    heat: true,
    magnetic: true,
    grid: false,
    weather: true,
    flight: true,
  },
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),

  oceanMode: false,
  setOceanMode: (v) => set({ oceanMode: v }),

  anomalies: [],
  feed: [],
  selectedId: null,
  scanning: true,
  scanSector: 'GLOBAL GRID',
  activeTab: 'ai',

  setBoot: (progress) => set({ bootProgress: progress, booted: progress >= 100 }),

  addAnomaly: (a) =>
    set((s) => {
      const anomalies = [a, ...s.anomalies].slice(0, 120)
      const feed = [
        {
          id: a.id,
          ts: a.timeDetected,
          label: a.headline,
          type: a.type,
          confidence: a.confidence,
          lat: a.lat,
          lon: a.lon,
        },
        ...s.feed,
      ].slice(0, 200)
      return { anomalies, feed }
    }),

  selectAnomaly: (id) =>
    set((s) => ({
      selectedId: id,
      activeTab: s.activeTab === 'uap' || s.activeTab === 'ocean' ? s.activeTab : 'event',
    })),

  setScanning: (v) => set({ scanning: v }),
  setScanSector: (sector) => set({ scanSector: sector }),
  setTab: (tab) => set({ activeTab: tab }),
  clearSelection: () => set({ selectedId: null }),
}))
