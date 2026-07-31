import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function StatusBar() {
  const feed = useStore((s) => s.feed)
  const scanSector = useStore((s) => s.scanSector)
  const scanning = useStore((s) => s.scanning)
  const [gpu, setGpu] = useState(82)

  useEffect(() => {
    const t = setInterval(() => setGpu(70 + Math.floor(Math.random() * 28)), 2200)
    return () => clearInterval(t)
  }, [])

  const ticker = feed
    .slice(0, 12)
    .map((f) => f.label)
    .join('   ◈   ')

  return (
    <footer className="statusbar">
      <div className="sb-left">
        <span className={`dot ${scanning ? 'pulse' : ''}`} />
        <span className="sb-sector">SECTOR: {scanSector}</span>
        <span className="sb-div" />
        <span className="sb-thru">DOWNLINK 1.24 Gbps</span>
      </div>
      <div className="sb-ticker">
        <div className="ticker-track">
          <span className="ticker-text">{ticker || 'grid quiet — awaiting signals'}</span>
        </div>
      </div>
      <div className="sb-right">
        <span className="sb-gpu-label">GPU INFERENCE</span>
        <div className="sb-gpu-track">
          <span className="sb-gpu-fill" style={{ width: `${gpu}%` }} />
        </div>
        <span className="sb-gpu-val">{gpu}%</span>
        <span className="sb-div" />
        <span className="sb-ver">v2035.04.18</span>
      </div>
    </footer>
  )
}
