import { useEffect } from 'react'
import { useStore } from './store'
import { startScanner, seedInitialAnomalies } from './core/engine'
import EarthScene from './globe/EarthScene'
import TopBar from './components/TopBar'
import LayerPanel from './components/LayerPanel'
import LiveFeed from './components/LiveFeed'
import OrionPanel from './components/OrionPanel'
import AnomalyDetail from './components/AnomalyDetail'
import UapModule from './components/UapModule'
import OceanModule from './components/OceanModule'
import StatusBar from './components/StatusBar'
import BootScreen from './components/BootScreen'

export default function App() {
  const booted = useStore((s) => s.booted)
  const activeTab = useStore((s) => s.activeTab)

  useEffect(() => {
    if (!booted) return
    const seed = seedInitialAnomalies()
    seed.forEach((a) => useStore.getState().addAnomaly(a))
    return startScanner()
  }, [booted])

  const renderTab = () => {
    switch (activeTab) {
      case 'ai':
        return <OrionPanel />
      case 'event':
        return <AnomalyDetail />
      case 'uap':
        return <UapModule />
      case 'ocean':
        return <OceanModule />
      default:
        return <OrionPanel />
    }
  }

  return (
    <div className="app">
      <BootScreen />
      <div className="globe-bg">
        <EarthScene />
      </div>
      <TopBar />
      <div className="left-col">
        <LayerPanel />
        <LiveFeed />
      </div>
      <div className="right-col">
        <div className="tab-bar">
          <button
            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => useStore.getState().setTab('ai')}
          >
            ORION AI
          </button>
          <button
            className={`tab ${activeTab === 'event' ? 'active' : ''}`}
            onClick={() => useStore.getState().setTab('event')}
          >
            EVENT
          </button>
          <button
            className={`tab ${activeTab === 'uap' ? 'active' : ''}`}
            onClick={() => useStore.getState().setTab('uap')}
          >
            UAP
          </button>
          <button
            className={`tab ${activeTab === 'ocean' ? 'active' : ''}`}
            onClick={() => useStore.getState().setTab('ocean')}
          >
            OCEAN
          </button>
        </div>
        {renderTab()}
      </div>
      <StatusBar />
      <div className="corner-hud tl">
        LAT 47.61°N
        <br />
        LON 122.33°W
      </div>
      <div className="corner-hud br">
        AI CONFIDENCE
        <br />
        REQUIRED: &lt; 1.0
      </div>
    </div>
  )
}
