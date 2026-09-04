<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  fileUrl: string | null       // URL pública del STL/3MF
  color: string | null         // hex del filamento; null = colores originales del archivo
  tipoMaterial: string         // "PLA" | "PLA+" | "PETG" (para aspecto visual)
  tamano: number               // mm elegido
  tamanoBase: number           // mm base del producto
}>()

const emit = defineEmits<{ (e: 'loading', v: boolean): void }>()

// ─── Estado ───────────────────────────────────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
const loading = ref(false)
watch(loading, v => emit('loading', v), { immediate: true })
// ponytail: token en vez de AbortController; los loaders de three no aceptan signal
let cargaToken = 0
const errorMsg = ref('')
// null en props.color = respetar los colores que trae el archivo

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: TrackballControls | null = null
let mesh: THREE.Mesh | THREE.Group | null = null
let animId: number | null = null

// ─── Aspecto visual por material ─────────────────────────────────────────────
function materialProps(tipo: string): { roughness: number; metalness: number } {
  const t = tipo.toLowerCase()
  if (t.includes('petg'))  return { roughness: 0.3, metalness: 0.08 }
  if (t.includes('pla+') || t === 'pla+') return { roughness: 0.6, metalness: 0.03 }
  return { roughness: 0.78, metalness: 0.0 } // PLA por defecto
}

function buildMaterial(): THREE.MeshStandardMaterial | null {
  if (!props.color) return null   // sin color elegido: no se pinta nada
  const { roughness, metalness } = materialProps(props.tipoMaterial)
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(props.color),
    roughness,
    metalness,
  })
}

// ─── Escala relativa al tamaño elegido ───────────────────────────────────────
function getScale(): number {
  return props.tamanoBase > 0 ? props.tamano / props.tamanoBase : 1
}


// ─── Inicializar Three.js ────────────────────────────────────────────────────
function init() {
  if (!canvasRef.value) return

  const w = canvasRef.value.clientWidth
  const h = canvasRef.value.clientHeight

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 5000)
  camera.position.set(0, 0, 300)

  // Luces
  const ambient = new THREE.AmbientLight(0xffffff, 0.9)
  scene.add(ambient)

  const dir = new THREE.DirectionalLight(0xffffff, 1.4)
  dir.position.set(100, 200, 150)
  dir.castShadow = true
  scene.add(dir)

  const fill = new THREE.DirectionalLight(0xffffff, 0.6)
  fill.position.set(-100, -50, -100)
  scene.add(fill)

  const rim = new THREE.DirectionalLight(0xffffff, 0.5)
  rim.position.set(0, -200, -200)
  scene.add(rim)

  controls = new TrackballControls(camera, renderer.domElement)
  controls.rotateSpeed = 3.0
  controls.zoomSpeed = 1.2
  controls.panSpeed = 0.8
  controls.dynamicDampingFactor = 0.15
  controls.minDistance = 10
  controls.maxDistance = 3000

  animate()
  window.addEventListener('resize', onResize)
}

function animate() {
  animId = requestAnimationFrame(animate)
  controls?.update()
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function onResize() {
  if (!canvasRef.value || !renderer || !camera) return
  const w = canvasRef.value.clientWidth
  const h = canvasRef.value.clientHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  controls?.handleResize()
}

// ─── Cargar modelo ───────────────────────────────────────────────────────────
async function loadModel(url: string) {
  if (!scene) return
  const token = ++cargaToken
  loading.value = true
  errorMsg.value = ''

  // Quitar modelo anterior
  if (mesh) { scene.remove(mesh); mesh = null }

  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? ''

  try {
    let geometry: THREE.BufferGeometry | null = null
    let group: THREE.Group | null = null

    if (ext === 'stl') {
      const loader = new STLLoader()
      geometry = await new Promise<THREE.BufferGeometry>((res, rej) =>
        loader.load(url, res, undefined, rej)
      )
    } else if (ext === '3mf') {
      const loader = new ThreeMFLoader()
      group = await new Promise<THREE.Group>((res, rej) =>
        loader.load(url, res, undefined, rej)
      )
    } else if (ext === 'obj') {
      const loader = new OBJLoader()
      group = await new Promise<THREE.Group>((res, rej) =>
        loader.load(url, res, undefined, rej)
      )
    } else {
      errorMsg.value = `Formato .${ext} no soportado en el visor`
      loading.value = false
      return
    }

    if (token !== cargaToken) return   // otra carga la adelanto

    const mat = buildMaterial()

    if (geometry) {
      geometry.computeVertexNormals()
      mesh = new THREE.Mesh(geometry, mat ?? new THREE.MeshStandardMaterial({ color: 0xd8dee9, roughness: 0.75 }))
      mesh.castShadow = true
      // STL exporters use Z-up; Three.js uses Y-up
      mesh.rotation.x = -Math.PI / 2
    } else if (group) {
      group.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          if (mat) (child as THREE.Mesh).material = mat   // sin mat = colores originales
          child.castShadow = true
        }
      })
      mesh = group
    }

    if (!mesh) return

    // Compute bbox after rotation so centering is correct
    mesh.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(mesh)
    const center = box.getCenter(new THREE.Vector3())
    mesh.position.sub(center)
    mesh.scale.setScalar(getScale())

    scene!.add(mesh)

    // Encuadrar cámara
    fitCamera(box)
  } catch (e) {
    errorMsg.value = 'No se pudo cargar el archivo 3D'
    console.error(e)
  } finally {
    if (token === cargaToken) loading.value = false
  }
}

function fitCamera(box: THREE.Box3) {
  if (!camera || !controls) return
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) * getScale()
  const fov = camera.fov * (Math.PI / 180)
  const dist = (maxDim / 2) / Math.tan(fov / 2) * 1.8
  camera.position.set(dist * 0.5, dist * 0.3, dist)
  camera.lookAt(0, 0, 0)
  controls.target.set(0, 0, 0)
  controls.minDistance = maxDim * 0.3
  controls.maxDistance = maxDim * 10
  controls.update()
}

// ─── Watchers reactivos ───────────────────────────────────────────────────────
watch(() => props.fileUrl, (url) => {
  if (url) loadModel(url)
  else if (mesh && scene) { scene.remove(mesh); mesh = null }
})

watch(() => [props.color, props.tipoMaterial], () => {
  // sin mesh todavia: la carga en curso ya lee props.color al terminar
  if (!mesh) return
  const mat = buildMaterial()
  if (!mat) {
    // Volver a "colores originales": recargar el archivo para restaurar sus materiales
    if (props.fileUrl) loadModel(props.fileUrl)
    return
  }
  mesh.traverse(child => {
    if ((child as THREE.Mesh).isMesh) (child as THREE.Mesh).material = mat
  })
  if ((mesh as THREE.Mesh).isMesh) (mesh as THREE.Mesh).material = mat
})

watch(() => props.tamano, () => {
  if (!mesh) return
  mesh.scale.setScalar(getScale())
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  init()
  if (props.fileUrl) loadModel(props.fileUrl)
})

onUnmounted(() => {
  if (animId !== null) cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
  renderer?.dispose()
})
</script>

<template>
  <div class="viewer-wrap">
    <canvas ref="canvasRef" class="viewer-canvas" />

    <!-- Loading overlay -->
    <Transition name="fade">
      <div v-if="loading" class="viewer-overlay">
        <div class="spinner" />
        <p>Cargando modelo…</p>
      </div>
    </Transition>

    <!-- Error -->
    <Transition name="fade">
      <div v-if="errorMsg && !loading" class="viewer-overlay viewer-error">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        <p>{{ errorMsg }}</p>
      </div>
    </Transition>

    <!-- Sin archivo -->
    <Transition name="fade">
      <div v-if="!fileUrl && !loading" class="viewer-overlay viewer-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        <p>Sin archivo 3D</p>
      </div>
    </Transition>

    <!-- Hint de controles -->
    <div class="viewer-hint">
      <span>Rotar · Scroll para zoom · Clic derecho para mover</span>
    </div>
  </div>
</template>

<style scoped>
.viewer-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: radial-gradient(ellipse at 30% 30%, #0f2744, #050d1f);
}

.viewer-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.viewer-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: radial-gradient(ellipse at 30% 30%, #0f2744, #050d1f);
}

.viewer-overlay p {
  font-size: 0.85rem;
  color: var(--text-soft);
}

.viewer-error { color: var(--text-soft); }
.viewer-empty { color: #1e3a5f; }
.viewer-empty svg { opacity: 0.25; }

/* Spinner */
.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Hint */
.viewer-hint {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.68rem;
  color: var(--text-muted);
  background: rgba(5, 13, 31, 0.6);
  padding: 0.3rem 0.75rem;
  border-radius: 99px;
  pointer-events: none;
  white-space: nowrap;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
