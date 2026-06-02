<template>
  <div class="viewport-container">
    <div class="viewport">
      <div class="viewport-label">主视角</div>
      <div class="canvas-bone-3d-container" ref="containerRef">
      </div>
    </div>
    <div class="viewport">
      <div class="viewport-label">俯视视角</div>
      <div class="canvas-bone-3d-container-top" ref="containerTopRef">
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { World } from '@/utils/world'
// import Canvas3D from '@/components/Canvas3D.vue'
const containerRef = ref<HTMLDivElement | null>(null)
const containerTopRef = ref<HTMLDivElement | null>(null)

let camera: THREE.PerspectiveCamera | null = null
let topCamera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let topRenderer: THREE.WebGLRenderer | null = null
let scene = new THREE.Scene()
let animationId: number | null = null
function initThree() {
  const container = containerRef.value
  const topContainer = containerTopRef.value
  if (!container || !topContainer) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(100, 200, 100)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
  scene.add(gridHelper)

  const axesHelper = new THREE.AxesHelper(100)
  scene.add(axesHelper)

  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)
  camera.position.set(0, 800, 1200)
  camera.lookAt(0, 0, 0)

  topCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)
  topCamera.position.set(0, 1500, 0)
  topCamera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  renderer.setSize(386, 386)
  container.appendChild(renderer.domElement)

  topRenderer = new THREE.WebGLRenderer({ antialias: true })
  topRenderer.setPixelRatio(window.devicePixelRatio)
  topRenderer.shadowMap.enabled = true
  topRenderer.setSize(386, 386)
  topContainer.appendChild(topRenderer.domElement)

  const loader = new GLTFLoader()

  loader.load('/ManClean.glb', (gltf: any) => {
    console.log('模型加载成功:', gltf)

    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        console.log('网格对象:', child.name, '材质:', child.material)
        if (!child.material || child.material.type === 'MeshBasicMaterial') {
          child.material = new THREE.MeshNormalMaterial()
        }
      }
      if (child.isBone) {
        console.log(`🦴 发现骨骼: ${child.name}`)
        if (child.name === 'upper_armL') {
          child.rotation.z = Math.PI * -0.85
        }
        if (child.name === 'upper_armR') {
          child.rotation.z = Math.PI * 0.85
        }
      }
    })

    const box = new THREE.Box3().setFromObject(gltf.scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    console.log('模型包围盒 - 中心:', center, '尺寸:', size)

    gltf.scene.position.sub(center)

    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 200 / maxDim
    gltf.scene.scale.set(scale, scale, scale)
    console.log('模型缩放:', scale)

    scene.add(gltf.scene)
    animate()
  }, (progress: any) => {
    const percent = (progress.loaded / progress.total * 100).toFixed(2)
    console.log('加载进度:', percent + '%')
  }, (error: any) => {
    console.error('OBJ文件加载失败:', error)
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)
  renderer?.render(scene, camera!)
  topRenderer?.render(scene, topCamera!)
}
onMounted(() => {
  initThree()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  renderer?.dispose()
  topRenderer?.dispose()
})
</script>
<style scoped>
.viewport-container {
  display: flex;
  gap: 8px;
  padding: 8px;
  width: 800px;
  height: 600px;
}

.viewport {
  position: relative;
  width: 400px;
  height: 400px;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 8px;
  overflow: hidden;
}

.viewport-label {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  z-index: 10;
  pointer-events: none;
}

.canvas-bone-3d-container,
.canvas-bone-3d-container-top {
  width: 100%;
  height: 100%;
}
</style>