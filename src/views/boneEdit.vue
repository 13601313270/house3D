<template>
  <div class="viewport-container" ref="viewportRef">
    <!-- {{ modelValue }} -->
    <div class="leftPanel">
      <div class="viewportSmall">
        <div class="viewport-label">俯视</div>
        <div class="canvas-bone-3d-container" ref="containerTopRef">
        </div>
      </div>
      <div class="viewportSmall">
        <div class="viewport-label">正前</div>
        <div class="canvas-bone-3d-container" ref="containerFrontRef">
        </div>
      </div>
      <div class="viewportSmall">
        <div class="viewport-label">左视</div>
        <div class="canvas-bone-3d-container" ref="containerLeftRef">
        </div>
      </div>
    </div>
    <div class="viewport">
      <div class="viewport-label">主视角</div>
      <div class="canvas-bone-3d-container" ref="containerRef">
      </div>
    </div>
    <div class="boneListPanel">
      <div>所有骨骼</div>
      <div class="boneItemList">
        <div v-for="item in allBones" :key="item.name" class="boneItem">
          <div class="label">
            <div>
              {{ nameToTitle[item.name] || item.name }}
            </div>
            <div>
              <!-- {{ item.value }} -->
              <button
                @click="changeBoneValue(item, 'x', item.basicValue.x), changeBoneValue(item, 'y', item.basicValue.y), changeBoneValue(item, 'z', item.basicValue.z)">初始值</button>
            </div>
          </div>
          <div>
            <input @input="changeBoneValue(item, 'x', $event)" type="range" v-model="item.value.x" step="0.01"
              min="-3.14" max="3.14" />
            <input v-if="item.name !== 'spine'" @input="changeBoneValue(item, 'y', $event)" type="range"
              v-model="item.value.y" step="0.01" min="-3.14" max="3.14" />
            <input @input="changeBoneValue(item, 'z', $event)" type="range" v-model="item.value.z" step="0.01"
              min="-3.14" max="3.14" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const viewportRef = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const containerTopRef = ref<HTMLDivElement | null>(null)
const containerFrontRef = ref<HTMLDivElement | null>(null)
const containerLeftRef = ref<HTMLDivElement | null>(null)

let scene = new THREE.Scene()
let animationId: number | null = null

const props = defineProps<{
  modelValue: Array<{
    name: string,
    value: {
      x: number,
      y: number,
      z: number,
    },
  }>
}>()

type ViewportConfig = {
  id: string
  type: 'perspective'
  position: [number, number, number]
  fov: number
  aspect: number
  getContainer: () => HTMLDivElement | null
} | {
  id: string
  type: 'orthographic'
  position: [number, number, number]
  orthoSize: number
  getContainer: () => HTMLDivElement | null
}

const emit = defineEmits<{
  (e: 'update:modelValue', value: Array<{
    name: string,
    value: {
      x: number,
      y: number,
      z: number,
    },
  }>): void
}>()

const allBones = ref<Array<{
  name: string,
  basicValue: {
    x: number,
    y: number,
    z: number,
  }
  value: {
    x: number,
    y: number,
    z: number,
  },
}>>((props.modelValue || []).map(item => {
  if (item.name === 'spine001') {
    console.log('初始化数据--1', item.value)
  }
  return {
    ...item,
    basicValue: item.value,
    value: item.value,
  }
}))

const nameToTitle = ref<Record<string, string>>({
  'spine': '整个身体',
  'spine001': '腰',
  'spine005': '脖子',
  'thighR': '大腿(左)',
  'shinR': '小腿(左)',
  'footR': '脚踝(左)',
  'shoulderL': '肩头(右)',
  'shoulderR': '肩头(左)',
  'upper_armL': '大臂(右)',
  'upper_armR': '大臂(左)',
  'forearmL': '小臂(右)',
  'forearmR': '小臂(左)',
  'handL': '手腕(右)',
  'handR': '手腕(左)',
  'thighL': '大腿(右)',
  'shinL': '小腿(右)',
  'footL': '脚踝(右)',
})
const viewportConfigs: ViewportConfig[] = [
  {
    id: 'main',
    type: 'perspective',
    position: [-300, 300, 400],
    fov: 45,
    aspect: 1,
    getContainer: () => containerRef.value
  },
  {
    id: 'top',
    type: 'orthographic',
    position: [0, 500, 0],
    orthoSize: 120,
    getContainer: () => containerTopRef.value
  },
  {
    id: 'front',
    type: 'orthographic',
    position: [0, 100, 500],
    orthoSize: 120,
    getContainer: () => containerFrontRef.value
  },
  {
    id: 'left',
    type: 'orthographic',
    position: [-500, 100, 0],
    orthoSize: 120,
    getContainer: () => containerLeftRef.value
  }
]

let allPanel: Array<{
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
}>
let controls: OrbitControls | null = null
const allPanelHeight = ref(0)

function initThree() {
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
  const leftPanelCount = 3;
  const allBorderHeight = leftPanelCount * 2 * 1 + (leftPanelCount - 1) * 6;
  const allPanelHeight2 = allPanelHeight.value - allBorderHeight;
  // 添加4个机位
  allPanel = viewportConfigs.map((config, index) => {
    let camera: THREE.Camera;
    if (config.type === 'perspective') {
      camera = new THREE.PerspectiveCamera(config.fov || 45, config.aspect || 1, 0.1, 2000)
    } else {
      camera = new THREE.OrthographicCamera(-config.orthoSize, config.orthoSize, config.orthoSize, -config.orthoSize)
    }
    camera.position.set(...config.position)
    camera.lookAt(0, 100, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true

    const container = config.getContainer() || document.createElement('div')
    if (config.type === 'perspective') {
      container.style.width = `${allPanelHeight.value - 2}px`
      container.style.height = `${allPanelHeight.value - 2}px`
      renderer.setSize(allPanelHeight.value - 2, allPanelHeight.value - 2)
    } else {
      container.style.width = `${allPanelHeight2 / 3}px`
      container.style.height = `${allPanelHeight2 / 3}px`
      renderer.setSize(allPanelHeight2 / 3, allPanelHeight2 / 3)
    }

    container.appendChild(renderer.domElement)

    if (index === 0 && config.type === 'perspective') {
      controls = new OrbitControls(camera, renderer.domElement)
      controls.target.set(0, 100, 0)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.enablePan = false
    }

    return {
      camera,
      renderer,
    }
  })

  const loader = new GLTFLoader()

  loader.load('/ManClean.glb', (gltf: any) => {
    console.log('模型加载成功:', gltf)

    // allBones.value = []
    const allBonesData: Array<{
      name: string,
      basicValue: {
        x: number,
        y: number,
        z: number,
      },
      value: {
        x: number,
        y: number,
        z: number,
      },
    }> = [];
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        console.log('网格对象:', child.name, '材质:', child.material)
        if (!child.material || child.material.type === 'MeshBasicMaterial') {
          child.material = new THREE.MeshNormalMaterial()
        }
      }
      if (child.isBone) {
        console.log(`🦴 发现骨骼: ${child.name}`)
        // if (child.name === 'upper_armL') {
        //   child.rotation.z = Math.PI * -0.85
        // }
        // if (child.name === 'upper_armR') {
        //   child.rotation.z = Math.PI * 0.85
        // }
        const findProp = allBones.value.find((item) => item.name === child.name)
        if (![
          'spine004', 'breastL',
          'breastR', 'pelvisL', 'pelvisR',
          'toeL', 'toeR', 'heel02L',
          'heel02R', 'spine002', 'spine003',
          'spine006'
        ].includes(child.name)) {
          allBonesData.push({
            name: child.name,
            basicValue: {
              x: findProp ? findProp.basicValue.x : child.rotation.x,
              y: findProp ? findProp.basicValue.y : child.rotation.y,
              z: findProp ? findProp.basicValue.z : child.rotation.z,
            },
            value: {
              x: findProp ? findProp.value.x : child.rotation.x,
              y: findProp ? findProp.value.y : child.rotation.y,
              z: findProp ? findProp.value.z : child.rotation.z,
            },
          })
        }
        if (findProp) {
          child.rotation.set(findProp.value.x, findProp.value.y, findProp.value.z)
        }
      }
    })
    allBones.value = allBonesData;

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

  controls?.update()

  allPanel.forEach((panel) => {
    panel.renderer.render(scene, panel.camera!)
  })
}

onMounted(() => {
  if (!viewportRef.value) return
  const { width, height } = viewportRef.value.getBoundingClientRect()
  allPanelHeight.value = height;
  nextTick(() => {
    initThree()
  })
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  controls?.dispose()
  allPanel.forEach((panel) => {
    panel.renderer.dispose()
  })
})
function changeBoneValue(item: {
  name: string,
  value: {
    x: number,
    y: number,
    z: number,
  },
}, editRotation: 'x' | 'y' | 'z', event: InputEvent | number) {
  let newValue = 0;
  if (typeof event === 'number') {
    newValue = +event
  } else {
    if (!event.target) return
    // @ts-ignore
    newValue = +event.target.value;
  }
  item.value[editRotation] = newValue;
  const bondMesh = scene.getObjectByName(item.name) as THREE.Mesh
  bondMesh.rotation[editRotation] = item.value[editRotation]
  emit('update:modelValue', allBones.value)
}
</script>
<style scoped lang="less">
.viewport-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  height: 100%;
  overflow: hidden;
}

.leftPanel {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .viewportSmall {
    position: relative;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    box-sizing: border-box;
    border-radius: 8px;
    overflow: hidden;
  }
}

.viewport {
  position: relative;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 8px;
  overflow: hidden;
}

.viewport-label {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  z-index: 10;
  pointer-events: none;
}

.canvas-bone-3d-container {
  width: 100%;
  height: 100%;
}

.boneListPanel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 250px;
  height: 100%;
  overflow: hidden;

  .boneItemList {
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;

    .boneItem {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        flex-shrink: 0;
        min-width: 70px;
        text-align: left;
      }
    }
  }
}
</style>
