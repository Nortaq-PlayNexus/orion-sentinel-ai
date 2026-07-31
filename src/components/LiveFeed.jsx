import { useEffect, useRef } from 'react'
import { useStore } from '../store'

const TYPE_TAG = {
  GEOMETRIC_FORMATION: 'GEO',
  THERMAL_SIGNATURE: 'THM',
  OCEAN_FLOOR: 'SFB',
  ATMOSPHERIC_UAP: 'UAP',
  RAPID_CHANGE: 'CHG',
  WILDLIFE_MIGRATION: 'WLD',
  UNKNOWN_STRUCTURE: 'STR',
}

export default function LiveFeed() {
  const feed = useStore((s) => s.feed)
  const selectAnomaly = useStore((s) => s.selectAnomaly)
  const box = useRef(null)

  useEffect(() => {
    if (box.current) box.current.scrollTop = 0
  }, [feed.length])

  return (
    <div className="glass panel feed-panel">
      <div className="panel-head">
        <span className="panel-title">LIVE AI ANALYSIS STREAM</span>
        <span className="panel-live">● LIVE</span>
      </div>
      <div className="feed-list" ref={box}>
        {feed.length === 0 && (
          <div className="feed-empty">Awaiting first signal from the grid...</div>
        )}
        {feed.map((f) => (
          <button key={f.id} className="feed-item" onClick={() => selectAnomaly(f.id)}>
            <div className="feed-meta">
              <span className="feed-type" style={{ background: typeColor(f.type) }}>
                {TYPE_TAG[f.type] || 'EVT'}
              </span>
              <span className="feed-id">{f.id}</span>
              <span className="feed-time">{fmt(f.ts)}</span>
            </div>
            <div className="feed-label">{f.label}</div>
            <div className="feed-bar">
              <span
                className="feed-bar-fill"
                style={{ width: `${f.confidence}%`, background: typeColor(f.type) }}
              />
            </div>
            <div className="feed-foot">
              <span>CONF {f.confidence.toFixed(1)}%</span>
              <span>
                {Math.abs(f.lat).toFixed(1)}° {f.lat >= 0 ? 'N' : 'S'} ·{' '}
                {Math.abs(f.lon).toFixed(1)}° {f.lon >= 0 ? 'E' : 'W'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function fmt(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour12: false })
}

function typeColor(type) {
  return (
    {
      GEOMETRIC_FORMATION: '#ffd166',
      THERMAL_SIGNATURE: '#ef476f',
      OCEAN_FLOOR: '#4cc9f0',
      ATMOSPHERIC_UAP: '#c77dff',
      RAPID_CHANGE: '#ff9f1c',
      WILDLIFE_MIGRATION: '#06d6a0',
      UNKNOWN_STRUCTURE: '#f78c6b',
    }[type] || '#46e0ff'
  )
}
