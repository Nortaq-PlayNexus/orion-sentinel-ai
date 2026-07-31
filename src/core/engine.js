import { useStore } from '../store'
import { latLonToVec3, randLatLon, REGIONS } from './geo'

let seq = 100

const TYPES = [
  {
    type: 'GEOMETRIC_FORMATION',
    category: 'land',
    color: '#ffd166',
    severity: [0.5, 0.9],
    headline: (n) => `Unusual geometric formation detected near ${n.region}`,
    descriptions: [
      'Multispectral imagery reveals a grid-like structure with unusual symmetry and reflectivity across multiple bands.',
      'High-resolution passes show repeated angular geometry inconsistent with surrounding natural terrain morphology.',
    ],
    explanations: [
      { label: 'Natural basalt columnar jointing', p: 0.34 },
      { label: 'Active mining / quarrying operation', p: 0.28 },
      { label: 'Unknown or unmapped structure', p: 0.22 },
      { label: 'Imaging artifact from sensor parallax', p: 0.16 },
    ],
  },
  {
    type: 'THERMAL_SIGNATURE',
    category: 'land',
    color: '#ef476f',
    severity: [0.5, 0.95],
    headline: (n) => `Abnormal thermal signature in ${n.region}`,
    descriptions: [
      'Infrared band 11 shows a sustained heat source with rapid onset and no matching industrial record.',
      'Night IR pass detected thermal output 4.2x above background baseline for the surrounding biome.',
    ],
    explanations: [
      { label: 'Unreported wildfire or gas flare', p: 0.4 },
      { label: 'Volcanic fumarole activity', p: 0.26 },
      { label: 'Infrastructure thermal load (untracked)', p: 0.2 },
      { label: 'Sensor calibration drift', p: 0.14 },
    ],
  },
  {
    type: 'OCEAN_FLOOR',
    category: 'ocean',
    color: '#4cc9f0',
    severity: [0.45, 0.9],
    headline: (n) => `Ocean floor abnormality mapped in ${n.region}`,
    descriptions: [
      'Bathymetric reconstruction shows a large elevated mass on the abyssal plain not present in archived sonar grids.',
      'Multibeam synthesis reveals a quasi-linear depression with sharp edges at 3,100 m depth.',
    ],
    explanations: [
      { label: 'Submarine landslide deposit', p: 0.38 },
      { label: 'Seamount / newly formed volcano', p: 0.27 },
      { label: 'Cabled infrastructure route', p: 0.18 },
      { label: 'Sonar processing artifact', p: 0.17 },
    ],
  },
  {
    type: 'ATMOSPHERIC_UAP',
    category: 'atmos',
    color: '#c77dff',
    severity: [0.4, 0.85],
    headline: (n) => `Unidentified aerial phenomenon tracked in ${n.region}`,
    descriptions: [
      'Multi-sensor correlation flagged a fast-moving object with no ADS-B, IFF or radar flight-plan correspondence.',
      'Trajectory does not match known aircraft performance envelopes under observed wind conditions.',
    ],
    explanations: [
      { label: 'High-altitude balloon / airship', p: 0.3 },
      { label: 'Satellite re-entry debris', p: 0.22 },
      { label: 'Manned aircraft (transponder-off)', p: 0.26 },
      { label: 'Optical satellite artifact / lens flare', p: 0.22 },
    ],
  },
  {
    type: 'RAPID_CHANGE',
    category: 'land',
    color: '#ff9f1c',
    severity: [0.45, 0.9],
    headline: (n) => `Rapid environmental change in ${n.region}`,
    descriptions: [
      'Temporal comparison across the last 120 days shows abrupt land-cover change exceeding the expected drift model.',
      'Phenology anomalies in vegetation indices with no matching weather or fire event.',
    ],
    explanations: [
      { label: 'Deforestation / land conversion', p: 0.42 },
      { label: 'Water body expansion or loss', p: 0.24 },
      { label: 'Biological outbreak affecting canopy', p: 0.18 },
      { label: 'Cloud shadow misclassification', p: 0.16 },
    ],
  },
  {
    type: 'WILDLIFE_MIGRATION',
    category: 'ocean',
    color: '#06d6a0',
    severity: [0.35, 0.75],
    headline: (n) => `Anomalous marine biomass aggregation in ${n.region}`,
    descriptions: [
      'Chlorophyll and acoustic backscatter indicate a large biomass cluster moving against prevailing current.',
      'Unusual density of large-bodied signals detected on passive sonar grid.',
    ],
    explanations: [
      { label: 'Large cetacean pod migration', p: 0.45 },
      { label: 'Commercial fishing aggregation', p: 0.26 },
      { label: 'Upwelling-driven plankton bloom', p: 0.18 },
      { label: 'Sensor cross-talk / noise', p: 0.11 },
    ],
  },
  {
    type: 'UNKNOWN_STRUCTURE',
    category: 'land',
    color: '#f78c6b',
    severity: [0.4, 0.9],
    headline: (n) => `Structure not matching any database near ${n.region}`,
    descriptions: [
      'Structure detection network found a new construction-like footprint that has no permit, cadastre or map entry.',
      'Shadow analysis suggests a height significantly exceeding local zoning records.',
    ],
    explanations: [
      { label: 'Newly built structure, pending registration', p: 0.44 },
      { label: 'Military or restricted facility', p: 0.24 },
      { label: 'Temporary site (festival, research camp)', p: 0.18 },
      { label: 'False positive from field pattern', p: 0.14 },
    ],
  },
]

const AGENTS = {
  land: ['Satellite Analyst Agent', 'Geological Agent', 'Verification Agent'],
  ocean: ['Ocean Research Agent', 'Wildlife Agent', 'Verification Agent'],
  atmos: ['Atmospheric Agent', 'Satellite Analyst Agent', 'Verification Agent'],
}

const SOURCES = [
  'Landsat 9',
  'Sentinel-2A',
  'Sentinel-1 (SAR)',
  'MODIS Terra',
  'VIIRS Nightfire',
  'GOES-18',
  'Himawari-9',
  'ICESat-2',
  'GRACE-FO',
  'EMODnet Bathymetry',
  'NOAA WOD',
  'Copernicus Marine',
]

const REGION_NAMES = [
  'the Philippine Sea',
  'the South Atlantic Anomaly',
  'the Sahara margins',
  'the Drake Passage',
  'the Bay of Bengal',
  'the Amazon Basin',
  'the North Pacific Gyre',
  'the Tibetan Plateau',
  'the Coral Triangle',
  'the Patagonian Shelf',
  'the Siberian Arctic coast',
  'the Namib coastal shelf',
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function latLonForType(cat, region) {
  if (region && REGIONS[region]) return REGIONS[region]
  if (cat === 'ocean') return randLatLon(true)
  if (cat === 'land') return randLatLon(false)
  return randLatLon(false)
}

export function spawnAnomaly(overrides = {}) {
  const tpl = overrides.type
    ? TYPES.find((t) => t.type === overrides.type) || pick(TYPES)
    : pick(TYPES)
  const region = overrides.region || pick(REGION_NAMES)
  const { lat, lon } = overrides.coords || latLonForType(tpl.category, overrides.regionKey)
  const confidence = Math.round((overrides.confidence || 55 + Math.random() * 35) * 10) / 10
  const severity =
    Math.round((tpl.severity[0] + Math.random() * (tpl.severity[1] - tpl.severity[0])) * 100) / 100
  const id = overrides.id || `ORION-${String(++seq).padStart(4, '0')}`
  const now = new Date()
  const anomaly = {
    id,
    type: tpl.type,
    category: tpl.category,
    color: tpl.color,
    lat,
    lon,
    region,
    confidence,
    severity,
    headline: tpl.headline({ region }),
    description: pick(tpl.descriptions),
    explanations: tpl.explanations,
    agents: AGENTS[tpl.category],
    sources: [...new Set([pick(SOURCES), pick(SOURCES), pick(SOURCES)])],
    timeDetected: now.toISOString(),
    status: overrides.status || 'new',
    vector: tpl.category === 'atmos' ? latLonToVec3(lat, lon, 1.05) : null,
    speed: tpl.category === 'atmos' ? Math.round(80 + Math.random() * 900) : null,
    altitude: tpl.category === 'atmos' ? Math.round(4 + Math.random() * 22) : null,
  }
  return anomaly
}

export function startScanner(ms = 2600) {
  let timer = null
  const run = () => {
    const { scanning, addAnomaly } = useStore.getState()
    if (scanning) {
      const a = spawnAnomaly()
      addAnomaly(a)
    }
    timer = setTimeout(run, ms * (0.6 + Math.random() * 0.9))
  }
  timer = setTimeout(run, 1500)
  return () => clearTimeout(timer)
}

export function seedInitialAnomalies() {
  const list = [
    spawnAnomaly({
      id: 'ORION-0042',
      regionKey: 'mariana trench',
      coords: REGIONS['mariana trench'],
      confidence: 91,
      type: 'OCEAN_FLOOR',
    }),
    spawnAnomaly({
      id: 'ORION-0041',
      regionKey: 'bermuda triangle',
      coords: REGIONS['bermuda triangle'],
      confidence: 74,
    }),
    spawnAnomaly({
      id: 'ORION-0040',
      regionKey: 'south china sea',
      coords: REGIONS['south china sea'],
      confidence: 82,
    }),
    spawnAnomaly({
      id: 'ORION-0039',
      regionKey: 'atlantic ocean',
      coords: REGIONS['atlantic ocean'],
      confidence: 66,
    }),
    spawnAnomaly({
      id: 'ORION-0038',
      regionKey: 'sahara margins',
      coords: { lat: 21, lon: 10 },
      confidence: 88,
    }),
    spawnAnomaly({
      id: 'ORION-0037',
      regionKey: 'pacific ocean',
      coords: { lat: -18, lon: -120 },
      confidence: 71,
    }),
    spawnAnomaly({
      id: 'ORION-0036',
      regionKey: 'arctic',
      coords: { lat: 76, lon: 40 },
      confidence: 58,
    }),
    spawnAnomaly({
      id: 'ORION-0035',
      regionKey: 'europe',
      coords: { lat: 45, lon: 12 },
      confidence: 79,
    }),
    spawnAnomaly({
      id: 'ORION-0034',
      regionKey: 'gulf of mexico',
      coords: REGIONS['gulf of mexico'],
      confidence: 63,
    }),
    spawnAnomaly({
      id: 'ORION-0033',
      regionKey: 'asia',
      coords: { lat: 35, lon: 103 },
      confidence: 87,
    }),
  ]
  return list
}
