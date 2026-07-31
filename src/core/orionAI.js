import { spawnAnomaly } from './engine'
import { REGIONS } from './geo'
import { useStore } from '../store'

const MATCH = {
  pacific: /pacific/i,
  atlantic: /atlantic/i,
  indian: /indian ocean/i,
  arctic: /arctic/i,
  antarctic: /antarctic|south pole/i,
  mariana: /mariana|trench/i,
  bermuda: /bermuda/i,
  ocean: /ocean|sea|marine|underwater|deep/i,
  scan: /scan|analyze|search|monitor|sweep/i,
  compare: /compare|history|historical|20 years|timeline|archive/i,
  investigate: /investigate|inspect|zoom|look at/i,
  unexplained: /unexplained|high.confidence|worldwide|global events|show events/i,
  uap: /uap|ufo|aerial|atmospheric|anomaly in the sky|flying/i,
  wildlife: /wildlife|animal|migration|creature|marine life/i,
  thermal: /thermal|heat|infrared|volcanic/i,
  oceanFloor: /ocean floor|seafloor|bathymetry|depth/i,
  anomaly: /anomaly|anomalies|event/i,
  status: /status|diagnostic|health|system/i,
  help: /help|commands|what can/i,
  source: /source|data|sensor/i,
  weather: /weather|storm|cyclone|hurricane/i,
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function sleepTyping(duration = 1400) {
  return delay(duration + Math.random() * 800)
}

function mentionLocations(text) {
  const found = []
  for (const key of Object.keys(REGIONS)) {
    if (new RegExp(key, 'i').test(text)) found.push(key)
  }
  return found
}

function regionCoordsText(keys) {
  return keys
    .map((k) => {
      const r = REGIONS[k]
      return `${k.replace(/\b\w/g, (c) => c.toUpperCase())} @ ${r.lat.toFixed(1)}°, ${r.lon.toFixed(1)}°`
    })
    .join(' · ')
}

async function buildBrief(keys, overrides) {
  const count = 3 + Math.floor(Math.random() * 3)
  const list = []
  for (let i = 0; i < count; i++) {
    list.push(
      spawnAnomaly({
        regionKey: keys[0] || overrides.regionKey,
        coords: overrides.coords,
        confidence: overrides.confidence,
      }),
    )
  }
  for (const a of list) useStore.getState().addAnomaly(a)
  return { list, keys }
}

export async function handleCommand(text) {
  const s = useStore.getState()
  const t = text.trim()

  if (
    MATCH.pacific.test(t) &&
    (MATCH.scan.test(t) || MATCH.anomaly.test(t) || MATCH.ocean.test(t))
  ) {
    const { list, keys } = await buildBrief(['pacific ocean'], {
      confidence: 62 + Math.random() * 20,
    })
    await sleepTyping(1800)
    return {
      title: 'PACIFIC OCEAN SWEEP COMPLETE',
      body: `Delegated to Ocean Research Agent and Satellite Analyst Agent. Scanned ~1.28e8 km² across 12 multispectral bands, SAR and bathymetric grids.\n\nDetected ${list.length} candidate signatures. Highest confidence: ${list[0].headline.toLowerCase()} (${list[0].confidence}%).\n\nConfidence is provisional — competing explanations listed per event. ${regionCoordsText(keys)}`,
      chips: [
        'Show high-confidence events worldwide',
        'Investigate the strongest signal',
        'Scan the Atlantic Ocean',
      ],
    }
  }

  if (MATCH.compare.test(t)) {
    const keys = mentionLocations(t)
    await sleepTyping(2000)
    return {
      title: 'TEMPORAL COMPARISON: 20-YEAR ARCHIVE',
      body: keys.length
        ? `Pulled 486 archive frames for ${keys.map((k) => k.replace(/\b\w/g, (c) => c.toUpperCase())).join(', ')} (2005–2026). Change surface: 14.2 km² classified as significant.\n\nPrimary drivers: land-cover conversion (61%), shoreline migration (19%), albedo shift (12%). Baseline variance models attribute 8% to sensor evolution.\n\nFull timelapse reconstruction available for frame-by-frame review.`
        : `Pulled the 20-year archive for the currently focused region. Change surface: 11.7 km² flagged significant against the drift model.\n\nHighlight: a structural footprint appeared between 2019-03 and 2019-07 with no corresponding registration record — routed to Verification Agent.\n\nCommand syntax: "Compare [region] across 20 years of imagery".`,
      chips: [
        'Scan the Pacific Ocean for unusual structures',
        'Show unexplained high-confidence events worldwide',
      ],
    }
  }

  if (MATCH.investigate.test(t)) {
    const keys = mentionLocations(t)
    const key = keys[0] || 'pacific ocean'
    await sleepTyping(2100)
    const a = spawnAnomaly({ regionKey: key, coords: REGIONS[key] })
    useStore.getState().addAnomaly(a)
    return {
      title: 'FOCUSED INVESTIGATION LAUNCHED',
      body: `Orbital tasking requested over ${key.replace(/\b\w/g, (c) => c.toUpperCase())}. Multi-angle revisit planned across the next 3 passes.\n\nFirst candidate already flagged: ${a.headline.toLowerCase()} — ${a.confidence}% confidence, provisional.\n\nI will correlate weather, tide, and traffic layers before updating the hypothesis set.`,
      chips: [
        'Scan the Pacific Ocean for unusual structures',
        'Compare this location across 20 years of imagery',
      ],
      focus: { lat: REGIONS[key].lat, lon: REGIONS[key].lon },
    }
  }

  if (MATCH.unexplained.test(t)) {
    await sleepTyping(1600)
    const high = s.anomalies.filter((a) => a.confidence >= 75).slice(0, 5)
    return {
      title: 'HIGH-CONFIDENCE EVENT REGISTER',
      body: high.length
        ? `Filtering the global register by confidence ≥ 75%: ${high.length} events stand out. Top signal: ${high[0].headline.toLowerCase()} (${high[0].confidence}%).\n\nAll remain under review — no conclusion presented as fact.`
        : 'Register is being populated. No events above the 75% threshold this cycle — the grid is quiet or data is incomplete.',
      chips: ['Scan the Pacific Ocean for unusual structures', 'Investigate the strongest signal'],
    }
  }

  if (MATCH.uap.test(t)) {
    const keys = mentionLocations(t)
    await sleepTyping(2200)
    const a = spawnAnomaly({
      type: 'ATMOSPHERIC_UAP',
      regionKey: keys[0],
      coords: keys[0] ? REGIONS[keys[0]] : undefined,
    })
    useStore.getState().addAnomaly(a)
    useStore.getState().setTab('uap')
    return {
      title: 'UAP / ATMOSPHERIC ANALYSIS',
      body: `Reconstructed trajectory for ${a.id}: ground speed ~${a.speed} km/h, ceiling ${a.altitude} km, heading stable ±3° across 4 sensor passes.\n\nFlight-path matching against the commercial registry found no ADS-B correspondence. Competing explanations retained: high-altitude balloon (30%), transponder-off aircraft (26%), satellite re-entry debris (22%), optical artifact (22%).\n\nScheduled for infrared verification on next pass.`,
      chips: [
        'Scan the Pacific Ocean for unusual structures',
        'Show unexplained high-confidence events worldwide',
      ],
      focus: { lat: a.lat, lon: a.lon },
    }
  }

  if (MATCH.oceanFloor.test(t)) {
    await sleepTyping(1800)
    const a = spawnAnomaly({
      type: 'OCEAN_FLOOR',
      regionKey: 'mariana trench',
      coords: REGIONS['mariana trench'],
      confidence: 89,
    })
    useStore.getState().addAnomaly(a)
    return {
      title: 'SEAFLOOR RECONSTRUCTION',
      body: `Bathymetric synthesis from multibeam + gravimetric inversion completed for the focused sector.\n\nAn elevated mass (~22 km × 9 km) sits on the abyssal plain at 3,140 m. Sonar archive shows no prior record. Top hypotheses: landslide deposit (38%), unmapped seamount (27%), cabling infrastructure (18%), processing artifact (17%).\n\nOcean mode enabled for underwater exploration.`,
      chips: ['Scan the Pacific Ocean for unusual structures', 'Enable ocean floor mode'],
    }
  }

  if (MATCH.wildlife.test(t)) {
    await sleepTyping(1700)
    return {
      title: 'MARINE BIOMASS ANALYSIS',
      body: 'Passive acoustic and chlorophyll synthesis suggest 3 major biomass aggregations migrating with, not against, the equatorial current.\n\nSignal-to-noise is strong; top explanation is a cetacean pod column (45%), with fishing aggregation (26%) and plankton bloom (18%) retained as alternatives.\n\nMonitoring continues across 5 acoustic stations.',
      chips: ['Scan the Pacific Ocean for unusual structures', 'Investigate this anomaly'],
    }
  }

  if (MATCH.thermal.test(t)) {
    await sleepTyping(1500)
    return {
      title: 'THERMAL MAPPING',
      body: 'Infrared composite (band 11 + VIIRS Nightfire) shows 14 active hotspots worldwide above the background threshold.\n\nMost map to known volcanic fields or flaring infrastructure. One source in the remote sector is unregistered — routed to Verification Agent for permit cross-check.',
      chips: [
        'Scan the Pacific Ocean for unusual structures',
        'Show unexplained high-confidence events worldwide',
      ],
    }
  }

  if (MATCH.status.test(t)) {
    await sleepTyping(900)
    return {
      title: 'SYSTEM DIAGNOSTIC',
      body: `All agent cores nominal. Live signatures scanned this session: ${s.feed.length}. Anomalies tracked: ${s.anomalies.length}. Active sweep: ${s.scanSector}.\n\nUplink: 6 satellite feeds · downlink: 12 curated sources · GPU inference: 98.4% utilization · latency: 44 ms.`,
      chips: ['Scan the Pacific Ocean for unusual structures', 'help'],
    }
  }

  if (MATCH.help.test(t)) {
    await sleepTyping(900)
    return {
      title: 'ORION AI — CAPABILITIES',
      body: `Try any of these directives:\n\n• "Scan the Pacific Ocean for unusual structures"\n• "Compare [region] across 20 years of imagery"\n• "Investigate this atmospheric anomaly"\n• "Show unexplained high-confidence events worldwide"\n• "Analyze the ocean floor"\n• "What marine life is in the Coral Triangle?"\n• "System status"`,
      chips: [
        'Scan the Pacific Ocean for unusual structures',
        'Show unexplained high-confidence events worldwide',
        'System status',
      ],
    }
  }

  await sleepTyping(1400)
  return {
    title: 'DIRECTIVE RECEIVED',
    body: `Parsed your directive but no matching routine surfaced. I can sweep ocean sectors, run temporal comparisons, investigate anomalies, or pull system status.\n\nTry a suggestion below or ask "help" for the full command set.`,
    chips: ['Scan the Pacific Ocean for unusual structures', 'help'],
  }
}
