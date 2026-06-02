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
      <div class="animationControls">
        <div class="progressContainer">
          <div class="progressBar" @click="seekTo">
            <div class="progressFill" :style="{ width: progressPercent + '%' }"></div>
            <div class="progressThumb" :style="{ left: progressPercent + '%' }"></div>
          </div>
          <div class="timeDisplay">
            {{ formatTime(currentTime) }} / {{ formatTime(totalDuration) }}
          </div>
        </div>
        <div class="controlButtons">
          <button @click="togglePlay" class="controlBtn">
            {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
          </button>
        </div>
      </div>
    </div>
    <div class="boneListPanel">
      <div class="boneItemList">
        <div v-for="item in allBones" :key="item.name" class="boneItem">
          <div class="label">
            <div>
              {{ nameToConfig[item.name]?.title || item.name }}
            </div>
            <div>
              <button
                @click="changeBoneValue(item, 'x', item.basicValue.x), changeBoneValue(item, 'y', item.basicValue.y), changeBoneValue(item, 'z', item.basicValue.z)">初始值</button>
            </div>
          </div>
          <div class="editList">
            <div class="editRange">
              <div>x:</div>
              {{ item.value.x }}
              <input class="editRangeInput" @input="changeBoneValue(item, 'x', $event)" type="range"
                v-model="item.value.x" step="0.01" :min="nameToConfig[item.name]?.minX || -3.14"
                :max="nameToConfig[item.name]?.maxX || 3.14" />
              <input type="number" :value="item.value.x" @input="changeBoneValue(item, 'x', $event)" />
            </div>
            <div class="editRange" v-if="item.name !== 'spine'">
              <div>y</div>
              <input class="editRangeInput" @input="changeBoneValue(item, 'y', $event)" type="range"
                v-model="item.value.y" step="0.01" min="-3.14" max="3.14" />
              <input type="number" :value="item.value.y" @input="changeBoneValue(item, 'y', $event)" />
            </div>
            <div class="editRange">
              <div>z</div>
              <input class="editRangeInput" @input="changeBoneValue(item, 'z', $event)" type="range"
                v-model="item.value.z" step="0.01" min="-3.14" max="3.14" />
              <input type="number" :value="item.value.z" @input="changeBoneValue(item, 'z', $event)" />
            </div>
          </div>
        </div>
      </div>
      <div class="bottomActions">
        <div class="saveBtn" @click="save">应用</div>
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
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

const viewportRef = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const containerTopRef = ref<HTMLDivElement | null>(null)
const containerFrontRef = ref<HTMLDivElement | null>(null)
const containerLeftRef = ref<HTMLDivElement | null>(null)

let scene = new THREE.Scene()
let animationId: number | null = null
let mixer: THREE.AnimationMixer | null = null
const clock = new THREE.Clock()

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

const isPlaying = ref(false)
const currentTime = ref(0)
const totalDuration = ref(0)
let currentAction: THREE.AnimationAction | null = null

const progressPercent = ref(0)

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function togglePlay() {
  if (!currentAction || !mixer) return

  if (isPlaying.value) {
    currentAction.paused = true
    isPlaying.value = false
  } else {
    currentAction.paused = false
    isPlaying.value = true
  }
}

function seekTo(event: MouseEvent) {
  if (!currentAction || !mixer || totalDuration.value === 0) return

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  const clampedPercent = Math.max(0, Math.min(1, percent))

  const newTime = clampedPercent * totalDuration.value
  currentTime.value = newTime
  progressPercent.value = clampedPercent * 100

  currentAction.time = newTime
}

async function applyPreset() {
  // if (['stand', 'sit', 'walk'].includes(preset.name)) {
  //   // const json = await import(`./peoplePose/${preset.name}.json`)
  //   // const jsonDefault = JSON.parse(JSON.stringify(json.default))
  //   // if (jsonDefault) {
  //   //   allBones.value.forEach(v => {
  //   //     const find = jsonDefault.find((item: any) => item.name === v.name)
  //   //     if (find) {
  //   //       v.value = find.value
  //   //       changeBoneValue(v, 'x', v.value.x)
  //   //       changeBoneValue(v, 'y', v.value.y)
  //   //       changeBoneValue(v, 'z', v.value.z)
  //   //     }
  //   //   })
  //   // }
  // } else {
  //   allBones.value.forEach(v => {
  //     const find = preset.bones.find((item: any) => item.name === v.name)
  //     if (find) {
  //       v.value = find.value
  //       changeBoneValue(v, 'x', v.value.x)
  //       changeBoneValue(v, 'y', v.value.y)
  //       changeBoneValue(v, 'z', v.value.z)
  //     }
  //   })
  //   // allBones.value = preset.bones.map(v => {
  //   //   const bondMesh = scene.getObjectByName(v.name) as THREE.Mesh
  //   //   bondMesh.rotation.x = v.value.x
  //   //   bondMesh.rotation.y = v.value.y
  //   //   bondMesh.rotation.z = v.value.z

  //   //   return {
  //   //     name: v.name,
  //   //     basicValue: v.value,
  //   //     value: v.value,
  //   //   }
  //   // });
  // }
  // const newBones = [];
  // preset.bones.forEach(boneData => {
  //   newBones.push({
  //     ...allBones.value.find(b => b.name === boneData.name),
  //     value: boneData.value,
  //   })
  //   // if (bone) {
  //   //   changeBoneValue(bone, 'x', boneData.value.x)
  //   //   changeBoneValue(bone, 'y', boneData.value.y)
  //   //   changeBoneValue(bone, 'z', boneData.value.z)
  //   // }
  // })
}

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

const nameToConfig = ref<{
  [key: string]: {
    title: string,
    minX: number,
    maxX: number,
    minY?: number,
    maxY?: number,
  }
}>({
  'spine': {
    title: '整个身体',
    minX: -3.14,
    maxX: 3.14,
  },
  'spine001': {
    title: '腰',
    minX: -3.14,
    maxX: 3.14,
  },
  'spine005': {
    title: '脖子',
    minX: -3.14,
    maxX: 3.14,
  },
  'thighR': {
    title: '大腿(左)',
    minX: 0,
    maxX: 6.28,
  },
  'shinR': {
    title: '小腿(左)',
    minX: -3.14,
    maxX: 3.14,
  },
  'footR': {
    title: '脚踝(左)',
    minX: -3.14,
    maxX: 3.14,
  },
  'shoulderL': {
    title: '肩头(右)',
    minX: -3.14,
    maxX: 3.14,
    minY: -3.14,
    maxY: 3.14,
  },
  'shoulderR': {
    title: '肩头(左)',
    minX: -3.14,
    maxX: 3.14,
  },
  'upper_armL': {
    title: '大臂(右)',
    minX: -3.14,
    maxX: 3.14,
  },
  'upper_armR': {
    title: '大臂(左)',
    minX: -3.14,
    maxX: 3.14,
  },
  'forearmL': {
    title: '小臂(右)',
    minX: -3.14,
    maxX: 3.14,
  },
  'forearmR': {
    title: '小臂(左)',
    minX: -3.14,
    maxX: 3.14,
  },
  'handL': {
    title: '手腕(右)',
    minX: -3.14,
    maxX: 3.14,
  },
  'handR': {
    title: '手腕(左)',
    minX: -3.14,
    maxX: 3.14,
  },
  'thighL': {
    title: '大腿(右)',
    minX: 0,
    maxX: 6.28,
  },
  'shinL': {
    title: '小腿(右)',
    minX: -3.14,
    maxX: 3.14,
  },
  'footL': {
    title: '脚踝(右)',
    minX: -3.14,
    maxX: 3.14,
  },
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

  const gltfLoader = new GLTFLoader()
  const fbxLoader = new FBXLoader()

  gltfLoader.load('/ManClean3.glb', (gltf: any) => {
    console.log('GLB模型加载成功:', gltf)

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
        if (child.name === 'mixamorigHips') {
          console.log(`🦴 GLB骨骼: ${child.name}`, child.rotation)
        }
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
        // if (findProp) {
        //   child.rotation.set(findProp.value.x, findProp.value.y, findProp.value.z)
        // }
      }
    })
    allBones.value = allBonesData;

    const box = new THREE.Box3().setFromObject(gltf.scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    console.log('模型包围盒 - 中心:', center, '尺寸:', size)

    // gltf.scene.position.sub(center)
    // gltf.scene.rotation.set(0, 0, 0)

    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 200 / maxDim
    gltf.scene.scale.set(scale, scale, scale)
    console.log('模型缩放:', scale)

    // gltf.scene.rotation.x = -Math.PI / 2

    scene.add(gltf.scene)

    fbxLoader.load('/sit.fbx', (fbxScene: any) => {
      console.log('FBX动画加载成功:', fbxScene)

      if (fbxScene.animations && fbxScene.animations.length > 0) {
        console.log('FBX发现动画:', fbxScene.animations.length, '个')
        fbxScene.animations.forEach((anim: any, index: number) => {
          console.log(`动画 ${index}: ${anim.name}, 时长: ${anim.duration.toFixed(2)}s`)
        })

        mixer = new THREE.AnimationMixer(gltf.scene)

        const clip = fbxScene.animations[0]
        currentAction = mixer.clipAction(clip, gltf.scene)
        totalDuration.value = clip.duration
        currentAction.play()
        isPlaying.value = true
        console.log(`播放动画: ${clip.name}`)
      } else {
        console.log('FBX文件没有包含动画数据')
      }

      animate()
    }, (progress: any) => {
      const percent = (progress.loaded / progress.total * 100).toFixed(2)
      console.log('FBX加载进度:', percent + '%')
    }, (error: any) => {
      console.error('FBX文件加载失败:', error)
      animate()
    })
  }, (progress: any) => {
    const percent = (progress.loaded / progress.total * 100).toFixed(2)
    console.log('GLB加载进度:', percent + '%')
  }, (error: any) => {
    console.error('GLB文件加载失败:', error)
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const delta = clock.getDelta()
  mixer?.update(delta)

  if (currentAction && totalDuration.value > 0) {
    currentTime.value = currentAction.time
    progressPercent.value = (currentTime.value / totalDuration.value) * 100

    if (currentTime.value >= totalDuration.value) {
      currentAction.time = 0
      currentTime.value = 0
      progressPercent.value = 0
    }
  }

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
  mixer?.stopAllAction()
  mixer = null;
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
}
function save() {
  if (currentAction && isPlaying.value) {
    currentAction.paused = true
    isPlaying.value = false
  }

  allBones.value.forEach(bone => {
    const boneObject = scene.getObjectByName(bone.name)
    if (boneObject && boneObject.isBone) {
      if (bone.name === 'mixamorigHips') {
        bone.value.x = -1.557879613085354
      } else {
        bone.value.x = boneObject.rotation.x
      }
      bone.value.y = boneObject.rotation.y
      bone.value.z = boneObject.rotation.z
    }
  })

  const saveVal = allBones.value.map(v => {
    return {
      name: v.name,
      value: v.value,
    }
  })
  console.log('保存数据', JSON.stringify(saveVal))
  emit('update:modelValue', saveVal)
}
</script>
<style scoped lang="less">
.viewport-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  height: 100%;
  padding: 6px;
  overflow: hidden;
  position: relative;
  flex-wrap: nowrap;
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

.bottomActions {
  padding-top: 12px;
  border-top: 1px solid #d9d9d9;

  .saveBtn {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background: #409eff;
    color: white;
    // border: 1px solid #409eff;
    cursor: pointer;
    font-size: 14px;
  }
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
        min-width: 80px;
        text-align: left;
      }

      .editList {
        flex-grow: 1;

        .editRange {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;

          .editRangeInput {
            flex-grow: 1;
          }
        }
      }
    }
  }

  .presetPanel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    overflow-y: auto;

    .presetItem {
      button {
        width: 100%;
        padding: 12px;
        border: 1px solid #d9d9d9;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;

        &:hover {
          border-color: #409eff;
          background: #e8f4ff;
        }

        &:active {
          transform: scale(0.98);
        }
      }
    }
  }
}

.animationControls {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  position: absolute;
  bottom: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  .progressContainer {
    flex-grow: 1;

    .progressBar {
      position: relative;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      overflow: visible;

      &:hover {
        background: #d0d0d0;
      }

      .progressFill {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: #409eff;
        border-radius: 4px;
        transition: width 0.1s;
      }

      .progressThumb {
        position: absolute;
        top: 50%;
        width: 16px;
        height: 16px;
        background: #409eff;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: left 0.1s;
      }
    }

    .timeDisplay {
      margin-top: 8px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  }

  .controlButtons {
    display: flex;
    gap: 8px;
    margin-left: 12px;

    .controlBtn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      background: #409eff;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;

      &:hover {
        background: #66b1ff;
      }

      &:active {
        transform: scale(0.98);
      }
    }
  }
}
</style>
