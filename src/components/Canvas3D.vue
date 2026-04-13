<template>
  <div class="canvas-3d-container" ref="containerRef">
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { Wall, Door, Window } from '../types/map2d'

interface DrawingData {
  walls: Wall[]
  doors: Door[]
  windows: Window[]
}

const props = defineProps<{
  data: DrawingData
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null

const initThree = () => {
  const container = containerRef.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)
  camera.position.set(0, 800, 1200)
  camera.lookAt(0, 0, 0)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(100, 200, 100)
  scene.add(directionalLight)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true

  if (container) {
    container.appendChild(renderer.domElement)
  }

  const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
  scene.add(gridHelper)

  const axesHelper = new THREE.AxesHelper(100)
  scene.add(axesHelper)
}

const renderWalls = () => {
  if (!scene) return

  props.data.walls.forEach((wall) => {
    if (wall.points.length < 2) return
    console.log(11111, wall.points)

    const points = wall.points.map((p) => new THREE.Vector2(p.x, p.y))
    const shape = new THREE.Shape(points)

    const extrudeSettings = {
      steps: 1,
      depth: 20,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 2,
      bevelSegments: 1
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    const material = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, side: THREE.DoubleSide })
    const wallMesh = new THREE.Mesh(geometry, material)
    wallMesh.position.set(0, 10, 0)
    wallMesh.castShadow = true
    wallMesh.receiveShadow = true
    scene!.add(wallMesh)

    wall.points.forEach((point) => {
      const pointGeometry = new THREE.SphereGeometry(3, 8, 8)
      const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x1890ff })
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
      pointMesh.position.set(point.x, 0, point.y)
      scene!.add(pointMesh)
    })
  })
}

const renderDoors = () => {
  if (!scene) return

  props.data.doors.forEach((door) => {
    const geometry = new THREE.CylinderGeometry(3, 3, 20, 8)
    const material = new THREE.MeshStandardMaterial({ color: 0xe67e22 })
    const doorMesh = new THREE.Mesh(geometry, material)
    doorMesh.position.set(door.x, 10, door.y)
    scene!.add(doorMesh)
  })
}

const renderWindows = () => {
  if (!scene) return

  props.data.windows.forEach((win) => {
    const geometry = new THREE.CylinderGeometry(3, 3, 20, 8)
    const material = new THREE.MeshStandardMaterial({ color: 0x3498db })
    const winMesh = new THREE.Mesh(geometry, material)
    winMesh.position.set(win.x, 10, win.y)
    scene!.add(winMesh)
  })
}

const animate = () => {
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
}

const resize = () => {
  if (!containerRef.value || !renderer || !camera) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

const updateScene = () => {
  if (scene) {
    while (scene.children.length > 0) {
      scene.remove(scene.children[0])
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 200, 100)
    scene.add(directionalLight)

    const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
    scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(100)
    scene.add(axesHelper)

    renderWalls()
    renderDoors()
    renderWindows()
  }
}

onMounted(() => {
  initThree()
  updateScene()
  animate()

  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)

  if (renderer) {
    renderer.dispose()
  }
})

watch(() => props.data, () => {
  updateScene()
}, { deep: true })
</script>

<style scoped>
.canvas-3d-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.drawing-canvas-3d {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
