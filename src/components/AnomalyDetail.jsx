import { useStore } from '../store'
import { fmtLatLon } from '../core/geo'

export default function AnomalyDetail() {
  const anomaly = useStore((s) => s.anomalies.find((a) => a.id === s.selectedId))
  const clearSelection = useStore((s) => s.clearSelection)
  const setTab = useStore((s) => s.setTab)

  if (!anomaly) return null

  return (
    <div className="glass panel event-panel">
      <div className="panel-head">
        <span className="panel-title">POTENTIAL ANOMALY — {anomaly.id}</span>
        <button className="close-btn" onClick={clearSelection}>
          ✕
        </button>
      </div>

      <div className="event-body">
        <div className="event-status">
          <span className="event-status-label">VERDICT</span>
          <span
            className="event-status-tag"
            style={{ borderColor: anomaly.color, color: anomaly.color }}
          >
            {anomaly.status === 'new' ? 'PROVISIONAL · UNDER REVIEW' : anomaly.status.toUpperCase()}
          </span>
        </div>

        <div className="event-headline" style={{ borderLeftColor: anomaly.color }}>
          {anomaly.headline}
        </div>

        <div className="event-grid">
          <div className="event-cell">
            <span className="cell-label">CONFIDENCE</span>
            <span className="cell-big" style={{ color: anomaly.color }}>
              {anomaly.confidence.toFixed(1)}%
            </span>
            <span className="cell-sub">probability-weighted · not certainty</span>
          </div>
          <div className="event-cell">
            <span className="cell-label">SEVERITY</span>
            <span className="cell-big">{Math.round(anomaly.severity * 100)}%</span>
          </div>
          <div className="event-cell">
            <span className="cell-label">COORDINATES</span>
            <span className="cell-coords">{fmtLatLon(anomaly.lat, anomaly.lon)}</span>
            <span className="cell-sub">{anomaly.region}</span>
          </div>
          <div className="event-cell">
            <span className="cell-label">DETECTED</span>
            <span className="cell-time">
              {new Date(anomaly.timeDetected).toLocaleString('en-GB', { hour12: false })}
            </span>
            <span className="cell-sub">UTC</span>
          </div>
        </div>

        <p className="event-desc">{anomaly.description}</p>

        <div className="event-section">
          <div className="event-section-title">COMPETING EXPLANATIONS</div>
          {anomaly.explanations.map((ex, i) => (
            <div key={i} className="expl-row">
              <div className="expl-label">
                <span>
                  {i + 1}. {ex.label}
                </span>
                <span className="expl-pct">{Math.round(ex.p * 100)}%</span>
              </div>
              <div className="expl-track">
                <span
                  className="expl-fill"
                  style={{ width: `${ex.p * 100}%`, background: anomaly.color }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="event-section">
          <div className="event-section-title">AGENT VERIFICATION PIPELINE</div>
          <div className="agent-flow">
            {anomaly.agents.map((a, i) => (
              <span
                key={a}
                className={`agent-node ${i === anomaly.agents.length - 1 ? 'final' : ''}`}
              >
                {a.replace(' Agent', '').toUpperCase()}
                {i < anomaly.agents.length - 1 && <span className="agent-arrow">→</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="event-section">
          <div className="event-section-title">DATA SOURCES</div>
          <div className="src-chips">
            {anomaly.sources.map((s) => (
              <span key={s} className="src-chip">
                {s}
              </span>
            ))}
          </div>
        </div>

        {anomaly.category === 'atmos' && (
          <button className="event-action" onClick={() => setTab('uap')}>
            ▶ OPEN UAP / ATMOSPHERIC ANALYSIS MODULE
          </button>
        )}
        {anomaly.category === 'ocean' && (
          <button className="event-action" onClick={() => setTab('ocean')}>
            ▶ OPEN OCEAN INTELLIGENCE MODULE
          </button>
        )}
      </div>
    </div>
  )
}
