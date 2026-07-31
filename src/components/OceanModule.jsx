import { useMemo } from 'react'
import { useStore } from '../store'

const DEPTH_ZONES = [
  { name: 'Epipelagic (0–200 m)', p: 100, color: '#2ee6a8' },
  { name: 'Mesopelagic (200–1000 m)', p: 68, color: '#2abf8f' },
  { name: 'Bathypelagic (1000–4000 m)', p: 34, color: '#2277c8' },
  { name: 'Abyssopelagic (4000–6000 m)', p: 14, color: '#143a86' },
  { name: 'Hadal (>6000 m)', p: 5, color: '#0b1033' },
]

const CURRENTS = [
  ['Kuroshio', '2.4 m/s', 'NE'],
  ['Gulf Stream', '2.1 m/s', 'N'],
  ['Antarctic Circumpolar', '1.8 m/s', 'E'],
  ['Agulhas', '1.6 m/s', 'SW'],
]

const CREATURES = [
  { id: 'BIO-021', label: 'Balaenoptera musculus cluster', conf: 87, zone: 'Epipelagic' },
  {
    id: 'BIO-022',
    label: 'Unknown midwater bioluminescent aggregation',
    conf: 61,
    zone: 'Mesopelagic',
  },
  { id: 'BIO-023', label: 'Physeter macrocephalus pod', conf: 78, zone: 'Mesopelagic' },
  { id: 'BIO-024', label: 'Trench floor scavenger anomaly', conf: 44, zone: 'Hadal' },
]

export default function OceanModule() {
  const setOceanMode = useStore((s) => s.setOceanMode)
  const oceanMode = useStore((s) => s.oceanMode)
  const allAnomalies = useStore((s) => s.anomalies)
  const anomalies = useMemo(
    () => allAnomalies.filter((a) => a.category === 'ocean'),
    [allAnomalies],
  )

  return (
    <div className="glass panel ocean-panel">
      <div className="panel-head">
        <span className="panel-title">OCEAN INTELLIGENCE MODULE</span>
        <button
          className={`mini-btn ${oceanMode ? 'active' : ''}`}
          onClick={() => setOceanMode(!oceanMode)}
        >
          {oceanMode ? '3D MODE ON' : 'ENABLE 3D'}
        </button>
      </div>

      <div className="ocean-body">
        <div className="ocean-stats">
          <div className="uap-stat">
            <span className="cell-label">DEPTH RECONSTRUCTED</span>
            <span className="cell-big">62.4%</span>
            <span className="cell-sub">of global ocean grid</span>
          </div>
          <div className="uap-stat">
            <span className="cell-label">SEAFLOOR ANOMALIES</span>
            <span className="cell-big">{anomalies.length}</span>
            <span className="cell-sub">under review</span>
          </div>
          <div className="uap-stat">
            <span className="cell-label">BIO-ACOUSTIC SIGNALS</span>
            <span className="cell-big">4,112</span>
            <span className="cell-sub">unique calls classified</span>
          </div>
        </div>

        <div className="event-section">
          <div className="event-section-title">BATHYMETRIC PRESSURE ZONES</div>
          {DEPTH_ZONES.map((z) => (
            <div key={z.name} className="expl-row">
              <div className="expl-label">
                <span>{z.name}</span>
                <span className="expl-pct">{z.p}%</span>
              </div>
              <div className="expl-track">
                <span className="expl-fill" style={{ width: `${z.p}%`, background: z.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="event-section">
          <div className="event-section-title">ACTIVE CURRENT SIMULATION</div>
          <table className="track-table">
            <thead>
              <tr>
                <th>SYSTEM</th>
                <th>VELOCITY</th>
                <th>HEADING</th>
              </tr>
            </thead>
            <tbody>
              {CURRENTS.map((c, i) => (
                <tr key={i}>
                  <td>{c[0]}</td>
                  <td>{c[1]}</td>
                  <td>{c[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="event-section">
          <div className="event-section-title">AI CREATURE IDENTIFICATION</div>
          <div className="creature-list">
            {CREATURES.map((c) => (
              <div key={c.id} className="creature-row">
                <span className="creature-tag">{c.id}</span>
                <span className="creature-label">{c.label}</span>
                <span className="creature-zone">{c.zone}</span>
                <span className="creature-conf">{c.conf}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="uap-note">
          Biomass density, temperature layers and pressure gradients streamed live from the
          bathymetric grid. Detections are hypothesis-level until verified across independent sonar
          passes.
        </div>
      </div>
    </div>
  )
}
