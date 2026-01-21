"use client"
import { useEffect, useRef, useState, Component, ReactNode } from "react"
import { Color, Scene, Fog, PerspectiveCamera, Vector3, Group } from "three"
import ThreeGlobe from "three-globe"
import { useThree, Canvas, extend } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { loadGlobeData } from "@/lib/utils/topojson-loader"
import { FeatureCollection } from "geojson"

// Check if WebGL is supported
function isWebGLSupported(): boolean {
  if (typeof window === "undefined") return false

  try {
    const canvas = document.createElement("canvas")
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    return gl !== null && gl !== undefined
  } catch (e) {
    return false
  }
}

// Error boundary specifically for the globe
interface GlobeErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface GlobeErrorBoundaryState {
  hasError: boolean
}

class GlobeErrorBoundary extends Component<
  GlobeErrorBoundaryProps,
  GlobeErrorBoundaryState
> {
  constructor(props: GlobeErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): GlobeErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn("Globe component failed to render:", error.message)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null
    }
    return this.props.children
  }
}
declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: ThreeElements["mesh"] & {
      new (): ThreeGlobe
    }
  }
}

extend({ ThreeGlobe: ThreeGlobe })

const RING_PROPAGATION_SPEED = 3
const aspect = 1.2
const cameraZ = 300

type Position = {
  order: number
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  arcAlt: number
  color: string
}

export type GlobeConfig = {
  pointSize?: number
  globeColor?: string
  showAtmosphere?: boolean
  atmosphereColor?: string
  atmosphereAltitude?: number
  emissive?: string
  emissiveIntensity?: number
  shininess?: number
  polygonColor?: string
  ambientLight?: string
  directionalLeftLight?: string
  directionalTopLight?: string
  pointLight?: string
  arcTime?: number
  arcLength?: number
  rings?: number
  maxRings?: number
  initialPosition?: {
    lat: number
    lng: number
  }
  autoRotate?: boolean
  autoRotateSpeed?: number
}

interface WorldProps {
  globeConfig: GlobeConfig
  data: Position[]
}

export function Globe({ globeConfig, data }: WorldProps) {
  const globeRef = useRef<ThreeGlobe | null>(null)
  const groupRef = useRef<Group>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [countries, setCountries] = useState<FeatureCollection | null>(null)
  const [isLoadingCountries, setIsLoadingCountries] = useState(true)

  const defaultProps = {
    pointSize: 1,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig
  }

  // Load countries data
  useEffect(() => {
    loadGlobeData()
      .then(data => {
        setCountries(data)
        setIsLoadingCountries(false)
      })
      .catch(error => {
        console.error("Failed to load globe data:", error)
        setIsLoadingCountries(false)
      })
  }, [])

  // Initialize globe only once
  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      globeRef.current = new ThreeGlobe()
      groupRef.current.add(globeRef.current)
      setIsInitialized(true)
    }
  }, [])

  // Build material when globe is initialized or when relevant props change
  useEffect(() => {
    if (!globeRef.current || !isInitialized) return

    const globeMaterial = globeRef.current.globeMaterial() as unknown as {
      color: Color
      emissive: Color
      emissiveIntensity: number
      shininess: number
    }
    globeMaterial.color = new Color(
      globeConfig.globeColor || defaultProps.globeColor
    )
    globeMaterial.emissive = new Color(
      globeConfig.emissive || defaultProps.emissive
    )
    globeMaterial.emissiveIntensity =
      globeConfig.emissiveIntensity ?? defaultProps.emissiveIntensity
    globeMaterial.shininess = globeConfig.shininess ?? defaultProps.shininess
  }, [
    isInitialized,
    globeConfig.globeColor,
    globeConfig.emissive,
    globeConfig.emissiveIntensity,
    globeConfig.shininess,
    defaultProps.globeColor,
    defaultProps.emissive,
    defaultProps.emissiveIntensity,
    defaultProps.shininess
  ])

  // Build data when globe is initialized or when data changes
  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data || !countries) return

    const arcs = data
    let points = []
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i]
      const rgb = hexToRgb(arc.color)

      // Skip processing if hexToRgb returns null
      if (!rgb) {
        console.warn(`Invalid color format: ${arc.color}, skipping arc`)
        continue
      }

      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.startLat,
        lng: arc.startLng
      })
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.endLat,
        lng: arc.endLng
      })
    }

    // remove duplicates for same lat and lng
    const filteredPoints = points.filter(
      (v, i, a) =>
        a.findIndex(v2 =>
          ["lat", "lng"].every(
            k => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"]
          )
        ) === i
    )

    globeRef.current
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .showAtmosphere(defaultProps.showAtmosphere)
      .atmosphereColor(defaultProps.atmosphereColor)
      .atmosphereAltitude(defaultProps.atmosphereAltitude)
      .hexPolygonColor(() => defaultProps.polygonColor)

    globeRef.current
      .arcsData(data)
      .arcStartLat(d => (d as { startLat: number }).startLat * 1)
      .arcStartLng(d => (d as { startLng: number }).startLng * 1)
      .arcEndLat(d => (d as { endLat: number }).endLat * 1)
      .arcEndLng(d => (d as { endLng: number }).endLng * 1)
      .arcColor((e: any) => (e as { color: string }).color)
      .arcAltitude(e => (e as { arcAlt: number }).arcAlt * 1)
      .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)])
      .arcDashLength(defaultProps.arcLength)
      .arcDashInitialGap(e => (e as { order: number }).order * 1)
      .arcDashGap(15)
      .arcDashAnimateTime(() => defaultProps.arcTime)

    globeRef.current
      .pointsData(filteredPoints)
      .pointColor(e => (e as { color: string }).color)
      .pointsMerge(true)
      .pointAltitude(0.0)
      .pointRadius(2)

    globeRef.current
      .ringsData([])
      .ringColor(() => defaultProps.polygonColor)
      .ringMaxRadius(defaultProps.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod(
        (defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings
      )
  }, [
    isInitialized,
    data,
    countries,
    defaultProps.pointSize,
    defaultProps.showAtmosphere,
    defaultProps.atmosphereColor,
    defaultProps.atmosphereAltitude,
    defaultProps.polygonColor,
    defaultProps.arcLength,
    defaultProps.arcTime,
    defaultProps.rings,
    defaultProps.maxRings
  ])

  // Handle rings animation with cleanup
  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return

    const interval = setInterval(() => {
      if (!globeRef.current) return

      const newNumbersOfRings = genRandomNumbers(
        0,
        data.length,
        Math.floor((data.length * 4) / 5)
      )

      const ringsData = data
        .filter((d, i) => newNumbersOfRings.includes(i))
        .map(d => ({
          lat: d.startLat,
          lng: d.startLng,
          color: d.color
        }))

      globeRef.current.ringsData(ringsData)
    }, 2000)

    return () => {
      clearInterval(interval)
    }
  }, [isInitialized, data])

  return <group ref={groupRef} />
}

export function WebGLRendererConfig() {
  const { gl, size } = useThree()

  useEffect(() => {
    if (typeof window === "undefined") return
    gl.setPixelRatio(window.devicePixelRatio)
    gl.setSize(size.width, size.height)
    gl.setClearColor(0xffaaff, 0)
  }, [gl, size])

  return null
}

// Fallback component when WebGL is not available
function GlobeFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-900/30 to-blue-900/30 rounded-full">
      <div className="text-center text-white/70 p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-400 to-green-400 opacity-60" />
        <p className="text-sm">Interactive globe</p>
      </div>
    </div>
  )
}

export function World(props: WorldProps) {
  const { globeConfig } = props
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setWebGLSupported(isWebGLSupported())
  }, [])

  // Show nothing while checking WebGL support
  if (webGLSupported === null) {
    return <GlobeFallback />
  }

  // Show fallback if WebGL is not supported
  if (!webGLSupported) {
    return <GlobeFallback />
  }

  const scene = new Scene()
  scene.fog = new Fog(0xffffff, 400, 2000)

  return (
    <GlobeErrorBoundary fallback={<GlobeFallback />}>
      <Canvas
        scene={scene}
        camera={new PerspectiveCamera(50, aspect, 180, 1800)}
      >
        <WebGLRendererConfig />
        <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
        <directionalLight
          color={globeConfig.directionalLeftLight}
          position={new Vector3(-400, 100, 400)}
        />
        <directionalLight
          color={globeConfig.directionalTopLight}
          position={new Vector3(-200, 500, 200)}
        />
        <pointLight
          color={globeConfig.pointLight}
          position={new Vector3(-200, 500, 200)}
          intensity={0.8}
        />
        <Globe {...props} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minDistance={cameraZ}
          maxDistance={cameraZ}
          autoRotateSpeed={1}
          autoRotate={true}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI - Math.PI / 3}
        />
      </Canvas>
    </GlobeErrorBoundary>
  )
}

export function hexToRgb(hex: string) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b
  })

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

export function genRandomNumbers(min: number, max: number, count: number) {
  const arr = []
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min
    if (arr.indexOf(r) === -1) arr.push(r)
  }

  return arr
}
