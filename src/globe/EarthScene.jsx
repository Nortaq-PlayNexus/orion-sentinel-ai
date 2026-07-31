import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
import { useStore } from '../store'
import { latLonToVec3 } from '../core/geo'
import {
  createEarthTextures,
  createNightLights,
  createCloudTexture,
  createBathymetryTexture,
} from './textures'

const SUN_DIR = new THREE.Vector3(0.32, 0.38, 0.87).normalize()

/* -------------------------------- Weather layer ------------------------------ */

function WeatherLayer() {
  const visible = useStore((s) => s.layers.weather)
  const oceanMode = useStore((s) => s.oceanMode)
  const group = useRef()
  const storms = useMemo(() => {
    const n = 9
    const base = []
    for (let i = 0; i < n; i++) {
      const lat = (Math.random() * 2 - 1) * 55
      const lon = Math.random() * 360 - 180
      const speed = 0.6 + Math.random() * 1.4
      base.push({
        pos: latLonToVec3(lat, lon, 1.035),
        axis: new THREE.Vector3(Math.random() - 0.5, 1, Math.random() - 0.5).normalize(),
        speed,
        scale: 0.06 + Math.random() * 0.07,
      })
    }
    return base
  }, [])
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.arc(64, 64, 8 + i * 7, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(220,240,255,${0.35 - i * 0.05})`
      ctx.lineWidth = 2
      ctx.stroke()
    }
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 52)
    g.addColorStop(0, 'rgba(120,200,255,0.28)')
    g.addColorStop(1, 'rgba(120,200,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c)
    return t
  }, [])

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    storms.forEach((s, i) => {
      const obj = group.current.children[i]
      if (!obj) return
      obj.rotateOnAxis(s.axis, s.speed * 0.012)
      const pulse = 1 + 0.15 * Math.sin(t * 1.8 + i * 2)
      obj.scale.setScalar(s.scale * pulse)
    })
  })

  if (!visible || oceanMode) return null
  return (
    <group ref={group}>
      {storms.map((s, i) => (
        <sprite key={i} position={s.pos}>
          <spriteMaterial
            map={tex}
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  )
}

/* -------------------------------- Flight arcs -------------------------------- */

function FlightArcs() {
  const visible = useStore((s) => s.layers.flight)
  const group = useRef()
  const arcs = useMemo(() => {
    const airports = [
      [34.05, -118.24],
      [40.71, -74.0],
      [51.47, -0.45],
      [35.55, 139.78],
      [1.36, 103.99],
      [48.85, 2.36],
      [28.55, 77.1],
      [37.62, -122.38],
      [-33.95, 151.18],
      [-23.43, -46.47],
      [25.25, 55.36],
      [19.09, 72.87],
    ]
    const n = 16
    const list = []
    for (let i = 0; i < n; i++) {
      const a = airports[Math.floor(Math.random() * airports.length)]
      const b = airports[Math.floor(Math.random() * airports.length)]
      if (a === b) continue
      const p0 = latLonToVec3(a[0], a[1], 1.02)
      const p1 = latLonToVec3(b[0], b[1], 1.02)
      const mid = p0
        .clone()
        .add(p1)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(1.02 + Math.random() * 0.1)
      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1)
      list.push({ curve, t: Math.random(), speed: 0.15 + Math.random() * 0.2 })
    }
    return list
  }, [])

  useFrame((state) => {
    if (!group.current) return
    arcs.forEach((a, i) => {
      const arcGroup = group.current.children[i]
      const dot = arcGroup?.children[0]
      const line = arcGroup?.children[1]
      if (dot) {
        a.t = (a.t + a.speed * state.clock.getDelta() * 0.5) % 1
        dot.position.copy(a.curve.getPointAt(a.t))
      }
      if (line) {
        line.material.opacity = 0.22 + 0.1 * Math.sin(state.clock.elapsedTime * 2 + i)
      }
    })
  })

  if (!visible) return null
  return (
    <group ref={group}>
      {arcs.map((a, i) => {
        const pts = a.curve.getPoints(32)
        const arr = new Float32Array(pts.length * 3)
        pts.forEach((p, k) => {
          arr[k * 3] = p.x
          arr[k * 3 + 1] = p.y
          arr[k * 3 + 2] = p.z
        })
        return (
          <group key={i}>
            <mesh>
              <sphereGeometry args={[0.006, 6, 6]} />
              <meshBasicMaterial color="#ffd166" toneMapped={false} />
            </mesh>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={pts.length}
                  array={arr}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color="#ffd166"
                transparent
                opacity={0.25}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </line>
          </group>
        )
      })}
    </group>
  )
}

/* ---------------------------------- Earth ---------------------------------- */

const EarthVert = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const EarthFrag = `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform vec3 sunDirection;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vec4 day = texture2D(dayMap, vUv);
  vec4 night = texture2D(nightMap, vUv);
  vec3 n = normalize(vNormal);
  float diff = clamp(dot(n, sunDirection), 0.0, 1.0);
  float nightMix = smoothstep(0.16, 0.02, diff);
  vec3 dayColor = day.rgb * (0.16 + diff * 1.05);
  vec3 nightColor = night.rgb * 2.6;
  vec3 color = mix(dayColor, max(dayColor * 0.18, nightColor * nightMix), nightMix);
  vec3 twilight = vec3(0.10, 0.16, 0.28) * pow(1.0 - abs(diff - 0.0), 14.0) * 0.6;
  color += twilight;
  gl_FragColor = vec4(color, 1.0);
}
`

function Earth() {
  const oceanMode = useStore((s) => s.oceanMode)
  const group = useRef()
  const { dayMap, nightMap, bathMap } = useMemo(
    () => ({
      dayMap: createEarthTextures(),
      nightMap: createNightLights(),
      bathMap: createBathymetryTexture(),
    }),
    [],
  )

  const uniforms = useMemo(
    () => ({
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      sunDirection: { value: SUN_DIR },
    }),
    [dayMap, nightMap],
  )

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.05
  })

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          uniforms={oceanMode ? { ...uniforms, dayMap: { value: bathMap } } : uniforms}
          vertexShader={EarthVert}
          fragmentShader={EarthFrag}
        />
      </mesh>
    </group>
  )
}

/* ---------------------------------- Clouds --------------------------------- */

const CloudVert = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const CloudFrag = `
uniform sampler2D map;
uniform vec3 sunDirection;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vec4 tex = texture2D(map, vUv);
  float a = tex.a;
  float diff = clamp(dot(normalize(vNormal), sunDirection), 0.0, 1.0);
  vec3 base = mix(vec3(0.08, 0.10, 0.14), vec3(1.0, 0.99, 0.97), clamp(0.25 + diff * 0.9, 0.0, 1.0));
  vec3 col = base * a;
  gl_FragColor = vec4(col, a * 0.9);
}
`

function Clouds() {
  const visible = useStore((s) => s.layers.clouds && !s.oceanMode)
  const ref = useRef()
  const tex = useMemo(() => createCloudTexture(), [])
  const uniforms = useMemo(() => ({ map: { value: tex }, sunDirection: { value: SUN_DIR } }), [tex])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012
  })

  if (!visible) return null
  return (
    <mesh ref={ref} scale={1.02}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={CloudVert}
        fragmentShader={CloudFrag}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

/* -------------------------------- Atmosphere -------------------------------- */

const AtmoVert = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const AtmoFrag = `
uniform vec3 glowColor;
varying vec3 vNormal;
void main() {
  float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
  gl_FragColor = vec4(glowColor, 1.0) * intensity;
}
`

function Atmosphere({ color = '#3aa7ff' }) {
  const uniforms = useMemo(() => ({ glowColor: { value: new THREE.Color(color) } }), [color])
  return (
    <mesh scale={1.14}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={AtmoVert}
        fragmentShader={AtmoFrag}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

/* ---------------------------------- Sun ------------------------------------ */

function SunSprite() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, 'rgba(255,244,214,1)')
    g.addColorStop(0.25, 'rgba(255,210,130,0.85)')
    g.addColorStop(0.6, 'rgba(255,160,60,0.28)')
    g.addColorStop(1, 'rgba(255,140,40,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const pos = SUN_DIR.clone().multiplyScalar(22)
  return (
    <sprite position={pos} scale={6}>
      <spriteMaterial map={tex} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
    </sprite>
  )
}

/* -------------------------------- Satellites -------------------------------- */

function SatelliteLayer() {
  const visible = useStore((s) => s.layers.satellites)
  const count = 26
  const sats = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        inc: (Math.random() * 160 - 80) * (Math.PI / 180),
        raan: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        alt: 1.14 + Math.random() * 0.2,
        speed: 0.35 + Math.random() * 0.5,
        dir: Math.random() > 0.5 ? 1 : -1,
        trail: Array.from({ length: 24 }, () => new THREE.Vector3()),
        t: Math.random() * 100,
      })),
    [],
  )
  const meshes = useRef([])
  const lines = useRef([])

  useFrame(() => {
    for (let i = 0; i < count; i++) {
      const s = sats[i]
      const m = meshes.current[i]
      const line = lines.current[i]
      if (!m) continue
      s.t += s.speed * 0.016
      const a = s.t
      const p = new THREE.Vector3(
        Math.cos(s.raan) * Math.cos(a) - Math.sin(s.raan) * Math.sin(a) * Math.cos(s.inc),
        Math.sin(a) * Math.sin(s.inc),
        Math.sin(s.raan) * Math.cos(a) + Math.cos(s.raan) * Math.sin(a) * Math.cos(s.inc),
      ).multiplyScalar(s.alt)
      p.multiplyScalar(s.dir)
      m.position.copy(p)
      s.trail.push(p.clone())
      if (s.trail.length > 24) s.trail.shift()
      if (line) {
        const geo = line.geometry
        const pos = geo.attributes.position.array
        for (let k = 0; k < s.trail.length; k++) {
          pos[k * 3] = s.trail[k].x
          pos[k * 3 + 1] = s.trail[k].y
          pos[k * 3 + 2] = s.trail[k].z
        }
        geo.attributes.position.needsUpdate = true
      }
    }
  })

  if (!visible) return null
  return (
    <group>
      {sats.map((s, i) => (
        <group key={i}>
          <mesh ref={(el) => (meshes.current[i] = el)}>
            <octahedronGeometry args={[0.006, 0]} />
            <meshBasicMaterial color="#aef2ff" toneMapped={false} />
          </mesh>
          <line ref={(el) => (lines.current[i] = el)}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={24}
                array={new Float32Array(24 * 3)}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#6fd8ff"
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </line>
        </group>
      ))}
    </group>
  )
}

/* -------------------------------- Heat layer -------------------------------- */

function HeatLayer() {
  const visible = useStore((s) => s.layers.heat)
  const mat = useRef()
  const points = useMemo(() => {
    const n = 90
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const lat = Math.asin(Math.random() * 2 - 1) * (180 / Math.PI)
      const lon = Math.random() * 360 - 180
      const v = latLonToVec3(lat, lon, 1.004)
      arr[i * 3] = v.x
      arr[i * 3 + 1] = v.y
      arr[i * 3 + 2] = v.z
    }
    return arr
  }, [])

  useFrame((state) => {
    if (mat.current) {
      mat.current.opacity = 0.45 + 0.25 * Math.sin(state.clock.elapsedTime * 2.2)
    }
  })

  if (!visible) return null
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        color="#ff5f2e"
        size={0.008}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function MagneticField() {
  const visible = useStore((s) => s.layers.magnetic)
  const group = useRef()
  const curves = useMemo(() => {
    const n = 14
    const list = []
    for (let i = 0; i < n; i++) {
      const rot = (i / n) * Math.PI * 2
      const bulge = 0.25 + Math.random() * 0.3
      const pts = []
      const steps = 40
      for (let k = 0; k <= steps; k++) {
        const t = k / steps
        const theta = (t - 0.5) * Math.PI
        const r = 1.12 + bulge * Math.sin(Math.PI * t)
        const y = Math.sin(theta) * 1.35 * r * 0.8
        const rad = Math.cos(theta) * r
        pts.push(new THREE.Vector3(Math.cos(rot) * rad, y, Math.sin(rot) * rad))
      }
      const curve = new THREE.CatmullRomCurve3(pts)
      list.push(curve.getPoints(40))
    }
    return list
  }, [])

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.08
  })

  if (!visible) return null
  return (
    <group ref={group}>
      {curves.map((pts, i) => {
        const arr = new Float32Array(pts.length * 3)
        pts.forEach((p, k) => {
          arr[k * 3] = p.x
          arr[k * 3 + 1] = p.y
          arr[k * 3 + 2] = p.z
        })
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={pts.length}
                array={arr}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#7f7bff"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </line>
        )
      })}
    </group>
  )
}

/* --------------------------------- Grid ------------------------------------ */

function GridLayer() {
  const visible = useStore((s) => s.layers.grid)
  const positions = useMemo(() => {
    const arr = []
    for (let lon = -180; lon <= 180; lon += 15) {
      const pts = []
      for (let i = 0; i <= 64; i++) {
        const lat = -90 + (i / 64) * 180
        pts.push(latLonToVec3(lat, lon, 1.006))
      }
      for (let i = 0; i < pts.length - 1; i++) {
        arr.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z)
      }
    }
    for (let lat = -75; lat <= 75; lat += 15) {
      const pts = []
      for (let i = 0; i <= 64; i++) {
        const lon = -180 + (i / 64) * 360
        pts.push(latLonToVec3(lat, lon, 1.006))
      }
      for (let i = 0; i < pts.length - 1; i++) {
        arr.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z)
      }
    }
    return new Float32Array(arr)
  }, [])

  if (!visible) return null
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#3fe0ff" transparent opacity={0.18} depthWrite={false} />
    </lineSegments>
  )
}

/* ----------------------------- Marine life (ocean) ---------------------------- */

function MarineLife() {
  const visible = useStore((s) => s.oceanMode)
  const mat = useRef()
  const points = useMemo(() => {
    const n = 220
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const lat = Math.asin(Math.random() * 2 - 1) * (180 / Math.PI) * 0.9
      const lon = Math.random() * 360 - 180
      const v = latLonToVec3(lat, lon, 1.008)
      arr[i * 3] = v.x
      arr[i * 3 + 1] = v.y
      arr[i * 3 + 2] = v.z
    }
    return arr
  }, [])
  useFrame((state) => {
    if (mat.current) mat.current.opacity = 0.5 + 0.3 * Math.sin(state.clock.elapsedTime * 1.4)
  })
  if (!visible) return null
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={mat}
        color="#2ee6a8"
        size={0.007}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ------------------------------- Scan rings -------------------------------- */

function ScanRings() {
  const group = useRef()
  const rings = useMemo(
    () =>
      [0, 0.6, 1.2].map((offset, i) => ({
        inc: (0.25 + i * 0.18) * Math.PI,
        raan: offset,
      })),
    [],
  )
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.25
  })
  return (
    <group ref={group}>
      {rings.map((r, i) => {
        const pts = []
        for (let k = 0; k <= 96; k++) {
          const a = (k / 96) * Math.PI * 2
          const p = new THREE.Vector3(
            Math.cos(r.raan) * Math.cos(a) - Math.sin(r.raan) * Math.sin(a) * Math.cos(r.inc),
            Math.sin(a) * Math.sin(r.inc),
            Math.sin(r.raan) * Math.cos(a) + Math.cos(r.raan) * Math.sin(a) * Math.cos(r.inc),
          ).multiplyScalar(1.055)
          pts.push(p)
        }
        const arr = new Float32Array(pts.length * 3)
        pts.forEach((p, k) => {
          arr[k * 3] = p.x
          arr[k * 3 + 1] = p.y
          arr[k * 3 + 2] = p.z
        })
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={pts.length}
                array={arr}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#46e0ff"
              transparent
              opacity={0.35 - i * 0.08}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </line>
        )
      })}
    </group>
  )
}

/* ------------------------------ Anomaly markers ------------------------------ */

const TYPE_LABEL = {
  GEOMETRIC_FORMATION: 'GEOMETRIC',
  THERMAL_SIGNATURE: 'THERMAL',
  OCEAN_FLOOR: 'SEAFLOOR',
  ATMOSPHERIC_UAP: 'UAP',
  RAPID_CHANGE: 'CHANGE',
  WILDLIFE_MIGRATION: 'WILDLIFE',
  UNKNOWN_STRUCTURE: 'STRUCTURE',
}

function AnomalyMarker({ anomaly, selected }) {
  const selectAnomaly = useStore((s) => s.selectAnomaly)
  const pos = useMemo(() => latLonToVec3(anomaly.lat, anomaly.lon, 1.01), [anomaly])
  const ring = useRef()

  useFrame((state) => {
    if (ring.current) {
      const t = state.clock.elapsedTime
      const s = 0.5 + 0.5 * Math.sin(t * 3 + anomaly.lon)
      ring.current.scale.setScalar(0.6 + s * (selected ? 0.9 : 0.55))
      ring.current.rotation.x = -Math.PI / 2
      ring.current.material.opacity = (selected ? 0.9 : 0.55) * (1 - s * 0.4)
    }
  })

  return (
    <group position={pos}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          selectAnomaly(anomaly.id)
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <octahedronGeometry args={[selected ? 0.017 : 0.012, 0]} />
        <meshBasicMaterial color={anomaly.color} toneMapped={false} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.026, 40]} />
        <meshBasicMaterial
          color={anomaly.color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <coneGeometry args={[0.004, 0.02, 6]} />
        <meshBasicMaterial color={anomaly.color} transparent opacity={0.8} toneMapped={false} />
      </mesh>
      {selected && (
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="marker-label" style={{ borderColor: anomaly.color }}>
            <span className="marker-tag" style={{ background: anomaly.color }}>
              {TYPE_LABEL[anomaly.type] || anomaly.type}
            </span>
            <span className="marker-id">{anomaly.id}</span>
            <span className="marker-conf">{anomaly.confidence}%</span>
          </div>
        </Html>
      )}
    </group>
  )
}

function AnomalyMarkers() {
  const anomalies = useStore((s) => s.anomalies)
  const selectedId = useStore((s) => s.selectedId)
  return (
    <group>
      {anomalies.map((a) => (
        <AnomalyMarker key={a.id} anomaly={a} selected={a.id === selectedId} />
      ))}
    </group>
  )
}

/* ------------------------------ Selection beam ------------------------------ */

function SelectionBeam() {
  const selectedId = useStore((s) => s.selectedId)
  const anomaly = useStore((s) => s.anomalies.find((a) => a.id === selectedId))
  const ref = useRef()
  if (!anomaly) return null
  const pos = latLonToVec3(anomaly.lat, anomaly.lon, 1.01)
  return (
    <group position={pos}>
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.004, 0.5, 8]} />
        <meshBasicMaterial color={anomaly.color} transparent opacity={0.35} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------------------------------- Scene ----------------------------------- */

export default function EarthScene() {
  const oceanMode = useStore((s) => s.oceanMode)
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.55, 3.9], fov: 45, near: 0.01, far: 100 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={SUN_DIR.clone().multiplyScalar(5)}
        intensity={2.4}
        color="#fff3dd"
      />
      <Earth />
      <Clouds />
      <Atmosphere color={oceanMode ? '#0b6ef2' : '#3aa7ff'} />
      <Stars radius={60} depth={40} count={7000} factor={4} saturation={0} fade speed={0.6} />
      <SunSprite />
      <SatelliteLayer />
      <HeatLayer />
      <WeatherLayer />
      <FlightArcs />
      <MagneticField />
      <GridLayer />
      <MarineLife />
      <ScanRings />
      <AnomalyMarkers />
      <SelectionBeam />
      <OrbitControls
        enablePan={false}
        minDistance={1.35}
        maxDistance={9}
        autoRotate
        autoRotateSpeed={0.35}
        makeDefault
      />
    </Canvas>
  )
}
