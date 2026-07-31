import { useStore } from '../store'
import { IMAGERY_ATTRIBUTION } from '../globe/imagery'

const LAYERS = [
  { key: 'satellites', label: 'Satellite constellation', icon: '◆' },
  { key: 'clouds', label: 'Cloud coverage', icon: '☁' },
  { key: 'weather', label: 'Weather systems', icon: '⛆' },
  { key: 'heat', label: 'Thermal hotspots', icon: '♨' },
  { key: 'magnetic', label: 'Magnetic field', icon: '⌁' },
  { key: 'grid', label: 'Reference grid', icon: '▦' },
  { key: 'flight', label: 'Flight paths', icon: '✈' },
]

export default function LayerPanel() {
  const layers = useStore((s) => s.layers)
  const toggleLayer = useStore((s) => s.toggleLayer)
  const oceanMode = useStore((s) => s.oceanMode)
  const setOceanMode = useStore((s) => s.setOceanMode)
  const setTab = useStore((s) => s.setTab)
  const satellite = useStore((s) => s.satellite)
  const setSatellite = useStore((s) => s.setSatellite)

  return (
    <div className="glass panel layer-panel">
      <div className="panel-head">
        <span className="panel-title">VISUAL LAYERS</span>
        <span className="panel-dot" />
      </div>
      <div className="layer-list">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            className={`layer-row ${layers[l.key] ? 'on' : 'off'}`}
            onClick={() => toggleLayer(l.key)}
          >
            <span className="layer-icon">{l.icon}</span>
            <span className="layer-label">{l.label}</span>
            <span className="layer-toggle">
              <span className="layer-knob" />
            </span>
          </button>
        ))}
      </div>
      <div className="layer-divider" />
      <div className="layer-modes">
        <button
          className={`mode-row ${satellite ? 'on' : ''}`}
          onClick={() => setSatellite(!satellite)}
        >
          <span className="layer-icon">🛰</span> SATELLITE IMAGERY
        </button>
        <button className={`mode-row ${oceanMode ? 'on' : ''}`} onClick={() => setOceanMode(true)}>
          <span className="layer-icon">≈</span> UNDERWATER GLOBE
        </button>
        <button
          className={`mode-row ${!oceanMode ? 'on' : ''}`}
          onClick={() => setOceanMode(false)}
        >
          <span className="layer-icon">⊕</span> SURFACE GLOBE
        </button>
        <button className="mode-row" onClick={() => setTab('ocean')}>
          <span className="layer-icon">▶</span> OCEAN INTELLIGENCE MODULE
        </button>
      </div>
      <div className="layer-credit">{IMAGERY_ATTRIBUTION}</div>
    </div>
  )
}
