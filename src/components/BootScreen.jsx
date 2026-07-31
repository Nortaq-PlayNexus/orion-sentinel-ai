import { useEffect, useState } from 'react'
import { useStore } from '../store'

export default function BootScreen() {
  const [progress, setProgress] = useState(0)
  const [line, setLine] = useState('Initializing orbital uplink...')
  const [gone, setGone] = useState(false)
  const setBoot = useStore((s) => s.setBoot)

  useEffect(() => {
    const steps = [
      ['Initializing orbital uplink...', 14],
      ['Linking satellite constellation (6 feeds)...', 32],
      ['Loading geospatial vector databases...', 46],
      ['Warming GPU inference cluster...', 61],
      ['Calibrating multispectral pipelines...', 74],
      [
        'Booting agent cores: Satellite · Ocean · Atmospheric · Geological · Wildlife · Verification...',
        88,
      ],
      ['ORION AI core online...', 98],
    ]
    let i = 0
    const t = setInterval(() => {
      if (i < steps.length) {
        setLine(steps[i][0])
        setProgress(steps[i][1])
        i++
      } else {
        setProgress(100)
        setBoot(100)
        clearInterval(t)
        setTimeout(() => setGone(true), 1000)
      }
    }, 340)
    return () => clearInterval(t)
  }, [setBoot])

  if (gone) return null

  const done = progress >= 100

  return (
    <div className={`boot ${done ? 'done' : ''}`}>
      <div className="boot-inner">
        <div className="boot-logo">
          <div className="boot-rings">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="boot-title">
          ORION <b>SENTINEL AI</b>
        </div>
        <div className="boot-sub">PLANETARY INTELLIGENCE COMMAND — BUILD 2035.04</div>
        <div className="boot-bar">
          <div className="boot-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="boot-line">{line}</div>
        <div className="boot-pct">{progress}%</div>
      </div>
    </div>
  )
}
