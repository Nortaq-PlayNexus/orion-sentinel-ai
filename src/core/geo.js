import * as THREE from 'three'

const RAD = Math.PI / 180

export function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * RAD
  const theta = (lon + 180) * RAD
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

export function vec3ToLatLon(v) {
  const r = v.length()
  const lat = Math.asin(v.y / r) / RAD
  const lon = Math.atan2(v.z / r, -v.x / r) / RAD - 180
  return { lat, lon }
}

export function randLatLon() {
  const lat = Math.asin(Math.random() * 2 - 1) / RAD
  const lon = Math.random() * 360 - 180
  return { lat, lon }
}

export function fmtLatLon(lat, lon) {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}° ${ns} / ${Math.abs(lon).toFixed(2)}° ${ew}`
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * RAD
  const dLon = (lon2 - lon1) * RAD
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}

export const REGIONS = {
  'pacific ocean': { lat: 5, lon: -140 },
  'atlantic ocean': { lat: 10, lon: -35 },
  'indian ocean': { lat: -15, lon: 80 },
  arctic: { lat: 80, lon: 0 },
  antarctic: { lat: -80, lon: 0 },
  'north america': { lat: 42, lon: -100 },
  'south america': { lat: -15, lon: -60 },
  africa: { lat: 5, lon: 20 },
  europe: { lat: 50, lon: 20 },
  asia: { lat: 40, lon: 90 },
  australia: { lat: -25, lon: 135 },
  'mariana trench': { lat: 11.35, lon: 142.2 },
  'bermuda triangle': { lat: 28, lon: -68 },
  mediterranean: { lat: 35, lon: 18 },
  'red sea': { lat: 20, lon: 38 },
  caribbean: { lat: 17, lon: -72 },
  'gulf of mexico': { lat: 25, lon: -90 },
  'south china sea': { lat: 12, lon: 114 },
}
