import { useEffect, useState } from 'react'
import { useStore } from '../store'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

function useUptime() {
  const [sec, setSec] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function TopBar() {
  const now = useClock()
  const uptime = useUptime()
  const anomalies = useStore((s) => s.anomalies.length)
  const feed = useStore((s) => s.feed.length)
  const scanning = useStore((s) => s.scanning)
  const setScanning = useStore((s) => s.setScanning)
  const oceanMode = useStore((s) => s.oceanMode)
  const setOceanMode = useStore((s) => s.setOceanMode)

  const utc = now.toISOString().slice(11, 19)
  const date = now.toISOString().slice(0, 10)

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <span className="brand-core" />
          <span className="brand-ring" />
          <span className="brand-orbit" />
        </div>
        <div className="brand-text">
          <div className="brand-title">
            ORION <span>SENTINEL AI</span>
          </div>
          <div className="brand-sub">PLANETARY INTELLIGENCE COMMAND</div>
        </div>
      </div>

      <div className="topbar-center">
        <div className="scan-indicator">
          <span className={`dot ${scanning ? 'pulse' : ''}`} />
          <span className="scan-label">{scanning ? 'LIVE GLOBAL SWEEP' : 'SWEEP PAUSED'}</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="stat">
          <span className="stat-label">EVENTS</span>
          <span className="stat-value">{String(anomalies).padStart(3, '0')}</span>
        </div>
        <div className="stat">
          <span className="stat-label">STREAMS</span>
          <span className="stat-value">{feed}</span>
        </div>
        <div className="stat">
          <span className="stat-label">UPTIME</span>
          <span className="stat-value">{uptime}</span>
        </div>
        <div className="stat clock">
          <span className="stat-label">UTC {date}</span>
          <span className="stat-value">{utc}</span>
        </div>
        <button
          className={`hud-btn ${oceanMode ? 'active' : ''}`}
          onClick={() => setOceanMode(!oceanMode)}
          title="Toggle underwater globe"
        >
          <span className="hud-icon">◉</span> OCEAN
        </button>
        <button
          className={`hud-btn ${scanning ? 'active' : ''}`}
          onClick={() => setScanning(!scanning)}
          title="Toggle AI scanner"
        >
          <span className="hud-icon">◎</span> {scanning ? 'PAUSE' : 'SCAN'}
        </button>
      </div>
    </header>
  )
}
