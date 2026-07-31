import { useStore } from '../store'

const SENSORS = [
  { name: 'Radar (RAD)', p: 78, color: '#46e0ff' },
  { name: 'Electro-optical (EO)', p: 64, color: '#ffd166' },
  { name: 'Infrared (IR)', p: 71, color: '#ef476f' },
  { name: 'RF emissions', p: 42, color: '#06d6a0' },
]

const EXPLANATIONS = [
  { label: 'High-altitude balloon / airship', p: 30, trend: 'stable' },
  { label: 'Manned aircraft (transponder-off)', p: 26, trend: 'up' },
  { label: 'Satellite re-entry debris', p: 22, trend: 'down' },
  { label: 'Optical satellite artifact', p: 22, trend: 'stable' },
]

const TRACK = [
  ['T+00:00', '34.82°N', '126.51°W', 'ALRT'],
  ['T+00:24', '34.90°N', '126.60°W', 'TRK'],
  ['T+00:51', '35.02°N', '126.72°W', 'TRK'],
  ['T+01:18', '35.18°N', '126.89°W', 'TRK'],
  ['T+01:47', '35.39°N', '127.11°W', 'CLMB'],
  ['T+02:20', '35.66°N', '127.40°W', 'ACC'],
]

export default function UapModule() {
  const selectedId = useStore((s) => s.selectedId)
  const anomaly = useStore((s) => s.anomalies.find((a) => a.id === selectedId))

  const speed = anomaly?.speed || 542
  const alt = anomaly?.altitude || 12.4
  const distKm = (speed * 2.33).toFixed(0)

  return (
    <div className="glass panel uap-panel">
      <div className="panel-head">
        <span className="panel-title">UAP / ATMOSPHERIC ANALYSIS</span>
        <span className="panel-status amber">PROVISIONAL</span>
      </div>

      <div className="uap-body">
        <div className="uap-topline">
          <span>
            OBJECT: <b>{anomaly ? anomaly.id : 'ORION-0071'}</b>
          </span>
          <span>CLASS: UNIDENTIFIED</span>
          <span>STATE: MULTI-SENSOR TRACK</span>
        </div>

        <div className="traj-box">
          <svg viewBox="0 0 320 150" preserveAspectRatio="none" className="traj-svg">
            <defs>
              <linearGradient id="trajfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c77dff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#c77dff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points="0,120 55,105 110,88 165,68 225,46 285,22 320,10"
              fill="none"
              stroke="#c77dff"
              strokeWidth="2"
              strokeDasharray="4 3"
              className="traj-path"
            />
            <polyline
              points="0,120 55,105 110,88 165,68 225,46 285,22 320,10"
              fill="url(#trajfill)"
              stroke="none"
              opacity="0.6"
            />
            {TRACK.map((t, i) => {
              const x = (i / (TRACK.length - 1)) * 320
              const y = 120 - (i / (TRACK.length - 1)) * 110
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  fill={i === TRACK.length - 1 ? '#ff5f8f' : '#e6c4ff'}
                />
              )
            })}
          </svg>
          <div className="traj-legend">
            <span>◍ RECONSTRUCTED TRAJECTORY</span>
            <span>6 SENSOR PASSES FUSED</span>
          </div>
        </div>

        <div className="uap-stats">
          <div className="uap-stat">
            <span className="cell-label">GROUND SPEED</span>
            <span className="cell-big">{speed} km/h</span>
            <span className="cell-sub">Δ ±4% across track</span>
          </div>
          <div className="uap-stat">
            <span className="cell-label">CEILING</span>
            <span className="cell-big">{alt} km</span>
            <span className="cell-sub">barometric est.</span>
          </div>
          <div className="uap-stat">
            <span className="cell-label">TRACK DISTANCE</span>
            <span className="cell-big">{distKm} km</span>
            <span className="cell-sub">great-circle, 140 min</span>
          </div>
        </div>

        <div className="event-section">
          <div className="event-section-title">COMPETING EXPLANATIONS (NEVER CONCLUSIVE)</div>
          {EXPLANATIONS.map((e, i) => (
            <div key={i} className="expl-row">
              <div className="expl-label">
                <span>
                  {i + 1}. {e.label}
                </span>
                <span className="expl-pct">
                  {e.p}%{' '}
                  <small className={e.trend === 'up' ? 'up' : e.trend === 'down' ? 'down' : ''}>
                    {e.trend === 'up' ? '▲' : e.trend === 'down' ? '▼' : '—'}
                  </small>
                </span>
              </div>
              <div className="expl-track">
                <span className="expl-fill" style={{ width: `${e.p}%`, background: '#c77dff' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="event-section">
          <div className="event-section-title">SENSOR CONFIDENCE ANALYSIS</div>
          {SENSORS.map((s) => (
            <div key={s.name} className="expl-row">
              <div className="expl-label">
                <span>{s.name}</span>
                <span className="expl-pct">{s.p}%</span>
              </div>
              <div className="expl-track">
                <span className="expl-fill" style={{ width: `${s.p}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="event-section">
          <div className="event-section-title">FLIGHT-PATH RECONSTRUCTION</div>
          <table className="track-table">
            <thead>
              <tr>
                <th>MARK</th>
                <th>LAT</th>
                <th>LON</th>
                <th>MODE</th>
              </tr>
            </thead>
            <tbody>
              {TRACK.map((t, i) => (
                <tr key={i} className={t[3] === 'ALRT' ? 'alrt' : ''}>
                  <td>{t[0]}</td>
                  <td>{t[1]}</td>
                  <td>{t[2]}</td>
                  <td>{t[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="uap-note">
            ADS-B / IFF correspondence: <b>NONE</b> · Weather correlation: <b>CLEAR, 8 km vis</b> ·
            Satellite visibility: <b>2 LEO passes confirmed</b>
          </div>
        </div>
      </div>
    </div>
  )
}
