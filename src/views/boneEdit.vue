<template>
  <div class="viewport-container" ref="viewportRef">
    <div class="topPanel">
      <div class="postList">
        <div v-for="item in allDemoList.slice(0, 5)" :key="item.file" class="item" @click="playAnimation(item.file)">
          <div class="name">{{ item.name }}</div>
          <img :src="item.img" alt="animation" />
        </div>
      </div>
      <div class="postList">
        <div v-for="item in allDemoList.slice(5, 9)" :key="item.file" class="item" @click="playAnimation(item.file)">
          <div class="name">{{ item.name }}</div>
          <img :src="item.img" alt="animation" />
        </div>
        <div class="moreBtn" @click="showModelPanel">
          更多
        </div>
      </div>
    </div>
    <div class="viewport">
      <div class="canvas-bone-3d-container" ref="containerRef">
      </div>
      <div class="animationControls">
        <div class="progressContainer">
          <div class="progressBar" @click="seekTo">
            <div class="progressFill" v-if="totalDuration >= 0.06" :style="{ width: progressPercent + '%' }"></div>
            <div class="progressThumb" v-if="totalDuration >= 0.06" :style="{ left: progressPercent + '%' }"></div>
          </div>
          <div class="timeDisplay">
            {{ formatTime(currentTime) }} / {{ formatTime(totalDuration) }}
          </div>
          <div @click="togglePlay" class="controlBtn">
            {{ isPlaying ? '⏸' : '▶' }}
          </div>
        </div>
        <div class="controlButtons">
          <div class="controlBtn" @click="save()">应用本帧</div>
          <div class="dropdown-wrapper" @mouseenter="handleDropdownEnter" @mouseleave="handleDropdownLeave">
            <div class="controlBtn dropdown-btn">...</div>
            <div :class="{ 'dropdown-menu': true, 'dropdown-menu-hidden': !showDropdown }"
              @mouseenter="handleDropdownEnter" @mouseleave="handleDropdownLeave">
              <div class="dropdown-item" @click.stop="saveUpperBody">仅应用上半身</div>
              <div class="dropdown-item" @click.stop="saveLowerBody">仅应用下半身</div>
              <div class="dropdown-item" @click.stop="saveHead">仅应用头</div>
              <div class="dropdown-item" @click.stop="saveLeftArm">仅应用左臂</div>
              <div class="dropdown-item" @click.stop="saveRightArm">仅应用右臂</div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="loading" class="loading">
        <img src="../assets/loading_white.svg" alt="loading" />
      </div>
    </div>
    <!-- <div class="boneListPanel" style="display: none;">
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
    </div> -->
  </div>

  <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-title">所有动画</span>
        <span class="modal-close" @click="showModal = false">×</span>
      </div>
      <div class="modal-body">
        <div v-for="item in allDemoList" :key="item.file" class="modal-item" @click="handleModalItemClick(item.file)">
          <img :src="item.img" alt="animation" />
          <span class="modal-item-name">{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import message from '@/utils/message'
import { sleep } from '@/utils/sleep'
import type { BoneStepItem } from '@/entities/people/index.d'

const viewportRef = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

let scene = new THREE.Scene()
let animationId: number | null = null
let mixer: THREE.AnimationMixer | null = null
const clock = new THREE.Clock()
let rootBone: THREE.Object3D | null = null
const originalPosition = new THREE.Vector3()

const showModal = ref(false)
const showDropdown = ref(false)
let dropdownHideTimer: ReturnType<typeof setTimeout> | null = null

const props = defineProps<{
  modelValue: Array<BoneStepItem>
}>()

const allDemoList = ref<Array<{
  name: string,
  img: string,
  file: string,
}>>([
  {
    name: '垂手站立',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/131220901/animated.gif',
    file: 'standing.fbx',
  },
  {
    name: '走路',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/118080901/animated.gif',
    file: 'walking.fbx',
  },
  {
    name: '趴下',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/120040901/animated.gif',
    file: 'plank.fbx',
  },
  {
    name: '跑',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/128630905/animated.gif',
    file: 'run.fbx',
  },
  {
    name: '躺',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/130560901/animated.gif',
    file: 'laying.fbx',
  },
  {
    name: '游泳',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/110800901/animated.gif',
    file: 'swimming.fbx',
  },
  {
    name: '侧躺',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140400905/animated.gif',
    file: 'layingPose.fbx',
  },
  {
    name: '坐',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/116270901/animated.gif',
    file: 'sit4.fbx',
  },
  {
    name: '跳跃',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/124500902/animated.gif',
    file: 'jump.fbx',
  },
  {
    name: '翘腿坐',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/116560901/animated.gif',
    file: 'sit2.fbx',
  },
  {
    name: '倚靠坐',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140600901/animated.gif',
    file: 'sit3.fbx',
  },
  {
    name: '前倾坐',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/137570901/animated.gif',
    file: 'sit.fbx',
  },
  {
    name: '倚靠坐2',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140600908/animated.gif',
    file: 'femaleSittingPose.fbx',
  },
  {
    name: '蹲下',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/137630901/animated.gif',
    file: 'squat.fbx',
  },
  {
    name: '跪下',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/103130903/animated.gif',
    file: 'praying.fbx',
  },
  {
    name: '拳击',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/113930901/animated.gif',
    file: 'punchingBag.fbx',
  },
  {
    name: '手撑躺',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/150400906/animated.gif',
    file: 'maleLayingPose.fbx',
  },
  {
    name: '单腿俏皮站立',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140700904/animated.gif',
    file: 'femaleStandingPose.fbx',
  },
  {
    name: '踢人',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/124070904/animated.gif',
    file: 'kick.fbx',
  },
  {
    name: '大摇大摆走',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/102230901/animated.gif',
    file: 'walk.fbx',
  },
  {
    name: '吊',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/114390901/animated.gif',
    file: 'hanging.fbx',
  },
  {
    name: '托马斯',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/121780901/animated.gif',
    file: 'flair.fbx',
  },
  {
    name: '前滚翻',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/130030901/animated.gif',
    file: 'running.fbx',
  },
  {
    name: '射箭',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/112390901/animated.gif',
    file: 'shootingArrow.fbx',
  },
  {
    name: '棒球击打',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/125420901/animated.gif',
    file: 'baseballHit.fbx',
  },
  {
    name: '街舞扫腿',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/121890901/animated.gif',
    file: 'breakdanceFreezeVar3.fbx'
  },
  {
    name: '舞蹈舒展',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/140200906/animated.gif',
    file: 'femaleDancePose.fbx'
  },
  {
    name: '霹雳舞波浪',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/101960901/animated.gif',
    file: 'hipHopDancing.fbx',
  },
  {
    name: '单膝跪',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/135940901/animated.gif',
    file: 'kneelingDown.fbx',
  },
  {
    name: '单膝跪',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/120580901/animated.gif',
    file: 'Salute.fbx',
  },
  {
    name: '抱着盒子',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/111220901/animated.gif',
    file: 'joggingWithBox.fbx',
  },
  {
    name: '挥手',
    img: 'https://d99n9xvb9513w.cloudfront.net/thumbnails/motions/136290901/animated.gif',
    file: 'waving.fbx'
  }
])

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

// async function applyPreset() {
//   if (['stand', 'sit', 'walk'].includes(preset.name)) {
//     // const json = await import(`./peoplePose/${preset.name}.json`)
//     // const jsonDefault = JSON.parse(JSON.stringify(json.default))
//     // if (jsonDefault) {
//     //   allBones.value.forEach(v => {
//     //     const find = jsonDefault.find((item: any) => item.name === v.name)
//     //     if (find) {
//     //       v.value = find.value
//     //       changeBoneValue(v, 'x', v.value.x)
//     //       changeBoneValue(v, 'y', v.value.y)
//     //       changeBoneValue(v, 'z', v.value.z)
//     //     }
//     //   })
//     // }
//   } else {
//     allBones.value.forEach(v => {
//       const find = preset.bones.find((item: any) => item.name === v.name)
//       if (find) {
//         v.value = find.value
//         changeBoneValue(v, 'x', v.value.x)
//         changeBoneValue(v, 'y', v.value.y)
//         changeBoneValue(v, 'z', v.value.z)
//       }
//     })
//     // allBones.value = preset.bones.map(v => {
//     //   const bondMesh = scene.getObjectByName(v.name) as THREE.Mesh
//     //   bondMesh.rotation.x = v.value.x
//     //   bondMesh.rotation.y = v.value.y
//     //   bondMesh.rotation.z = v.value.z

//     //   return {
//     //     name: v.name,
//     //     basicValue: v.value,
//     //     value: v.value,
//     //   }
//     // });
//   }
//   const newBones = [];
//   preset.bones.forEach(boneData => {
//     newBones.push({
//       ...allBones.value.find(b => b.name === boneData.name),
//       value: boneData.value,
//     })
//     // if (bone) {
//     //   changeBoneValue(bone, 'x', boneData.value.x)
//     //   changeBoneValue(bone, 'y', boneData.value.y)
//     //   changeBoneValue(bone, 'z', boneData.value.z)
//     // }
//   })
// }

const allBones = ref<Array<{
  name: string,
  basicValue: {
    x: number,
    y: number,
    z: number,
    px: number,
    py: number,
    pz: number,
  }
  value: {
    x: number,
    y: number,
    z: number,
    px: number,
    py: number,
    pz: number,
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

// const nameToConfig = ref<{
//   [key: string]: {
//     title: string,
//     minX: number,
//     maxX: number,
//     minY?: number,
//     maxY?: number,
//   }
// }>({
//   'spine': {
//     title: '整个身体',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'spine001': {
//     title: '腰',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'spine005': {
//     title: '脖子',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'thighR': {
//     title: '大腿(左)',
//     minX: 0,
//     maxX: 6.28,
//   },
//   'shinR': {
//     title: '小腿(左)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'footR': {
//     title: '脚踝(左)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'shoulderL': {
//     title: '肩头(右)',
//     minX: -3.14,
//     maxX: 3.14,
//     minY: -3.14,
//     maxY: 3.14,
//   },
//   'shoulderR': {
//     title: '肩头(左)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'upper_armL': {
//     title: '大臂(右)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'upper_armR': {
//     title: '大臂(左)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'forearmL': {
//     title: '小臂(右)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'forearmR': {
//     title: '小臂(左)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'handL': {
//     title: '手腕(右)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'handR': {
//     title: '手腕(左)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'thighL': {
//     title: '大腿(右)',
//     minX: 0,
//     maxX: 6.28,
//   },
//   'shinL': {
//     title: '小腿(右)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
//   'footL': {
//     title: '脚踝(右)',
//     minX: -3.14,
//     maxX: 3.14,
//   },
// })
const viewportConfigs: ViewportConfig[] = [
  {
    id: 'main',
    type: 'perspective',
    position: [-300, 300, 400],
    fov: 45,
    aspect: 1,
    getContainer: () => containerRef.value
  },
]

let allPanel: Array<{
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
}>
let controls: OrbitControls | null = null
const allPanelHeight = ref(0)

const fbxLoader = new FBXLoader()
let fbxModel: THREE.Group | null = null

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

  fbxLoader.load('/ManClean.fbx', (fbxModel_: any) => {
    console.log('FBX模型加载成功:', fbxModel_)
    fbxModel = fbxModel_ as THREE.Group

    const allBonesData: Array<{
      name: string,
      basicValue: {
        x: number,
        y: number,
        z: number,
        px: number,
        py: number,
        pz: number,
      },
      value: {
        x: number,
        y: number,
        z: number,
        px: number,
        py: number,
        pz: number,
      },
    }> = [];
    fbxModel.traverse((child: any) => {
      if (child.isMesh) {
        console.log('对象:', child.name, '材质:', child.material)
        if (!child.material || child.material.type === 'MeshBasicMaterial') {
          child.material = new THREE.MeshNormalMaterial()
        }
      }
      if (child.isBone) {
        if (child.name === 'mixamorigHips') {
          console.log(`🦴 骨骼: ${child.name}`, child.rotation)
        }
        const findProp = allBones.value.find((item) => item.name === child.name)
        allBonesData.push({
          name: child.name,
          basicValue: {
            x: findProp ? findProp.basicValue.x : child.rotation.x,
            y: findProp ? findProp.basicValue.y : child.rotation.y,
            z: findProp ? findProp.basicValue.z : child.rotation.z,
            px: findProp ? findProp.basicValue.px : child.position.x,
            py: findProp ? findProp.basicValue.py : child.position.y,
            pz: findProp ? findProp.basicValue.pz : child.position.z,
          },
          value: {
            x: findProp ? findProp.value.x : child.rotation.x,
            y: findProp ? findProp.value.y : child.rotation.y,
            z: findProp ? findProp.value.z : child.rotation.z,
            px: findProp ? findProp.value.px : child.position.x,
            py: findProp ? findProp.value.py : child.position.y,
            pz: findProp ? findProp.value.pz : child.position.z,
          },
        })
      }
    })
    console.log('所有骨骼:', allBonesData)
    allBones.value = allBonesData;

    const box = new THREE.Box3().setFromObject(fbxModel)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    console.log('模型包围盒 - 中心:', center, '尺寸:', size)

    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 200 / maxDim
    fbxModel.scale.set(scale, scale, scale)
    console.log('模型缩放:', scale)

    rootBone = fbxModel.getObjectByName('Armature') || fbxModel.children[0]
    originalPosition.copy(rootBone.position)

    scene.add(fbxModel)

    runPostAnimation('./pose/standing.fbx')
  })
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const delta = clock.getDelta()
  mixer?.update(delta)

  if (currentAction && totalDuration.value > 0) {
    // scene.children.forEach((child: any) => {
    //   child.position.set(0, 0, 0)
    // })
    currentTime.value = currentAction.time
    progressPercent.value = (currentTime.value / totalDuration.value) * 100

    if (currentTime.value >= totalDuration.value) {
      currentAction.time = 0
      currentTime.value = 0
      progressPercent.value = 0
    }
    // save();
  }

  controls?.update()

  allPanel.forEach((panel) => {
    panel.renderer.render(scene, panel.camera!)
  })
}

onMounted(() => {
  if (!viewportRef.value) return
  allPanelHeight.value = 428;
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
// function changeBoneValue(item: {
//   name: string,
//   value: {
//     x: number,
//     y: number,
//     z: number,
//   },
// }, editRotation: 'x' | 'y' | 'z', event: InputEvent | number) {
//   let newValue = 0;
//   if (typeof event === 'number') {
//     newValue = +event
//   } else {
//     if (!event.target) return
//     // @ts-ignore
//     newValue = +event.target.value;
//   }
//   item.value[editRotation] = newValue;
//   const bondMesh = scene.getObjectByName(item.name) as THREE.Mesh
//   bondMesh.rotation[editRotation] = item.value[editRotation]
// }
function save(boneFilter?: (name: string) => boolean) {
  if (currentAction && isPlaying.value) {
    currentAction.paused = true
    isPlaying.value = false
  }

  allBones.value.forEach(bone => {
    if (boneFilter && !boneFilter(bone.name)) return
    const boneObject = scene.getObjectByName(bone.name)
    if (boneObject) {
      bone.value.x = boneObject.rotation.x
      bone.value.y = boneObject.rotation.y
      bone.value.z = boneObject.rotation.z
      bone.value.px = boneObject.position.x
      bone.value.py = boneObject.position.y
      bone.value.pz = boneObject.position.z
    }
  })

  const saveVal = allBones.value.map(v => {
    return {
      name: v.name,
      value: v.value,
    }
  })
  emit('update:modelValue', saveVal)
}

const headBones: string[] = [
  'mixamorigNeck',
  'mixamorigHead',
  'mixamorigHeadTop_End',
  'mixamorigHeadTop_End_end',
  'mixamorigHeadTop_End_end_end',
];

const leftArmBones: string[] = [
  'mixamorigLeftShoulder',
  'mixamorigLeftArm',
  'mixamorigLeftForeArm',
  'mixamorigLeftHand',
  'mixamorigLeftHandThumb1',
  'mixamorigLeftHandThumb2',
  'mixamorigLeftHandThumb3',
  'mixamorigLeftHandThumb4',
  'mixamorigLeftHandPinky1',
  'mixamorigLeftHandPinky2',
  'mixamorigLeftHandPinky3',
  'mixamorigLeftHandPinky4',
  'mixamorigLeftHandMiddle1',
  'mixamorigLeftHandMiddle2',
  'mixamorigLeftHandMiddle3',
  'mixamorigLeftHandMiddle4',
  'mixamorigLeftHandRing1',
  'mixamorigLeftHandRing2',
  'mixamorigLeftHandRing3',
  'mixamorigLeftHandRing4',
  'mixamorigLeftHandPinky1',
  'mixamorigLeftHandPinky2',
  'mixamorigLeftHandPinky3',
  'mixamorigLeftHandPinky4',
]

const rightArmBones = [
  'mixamorigRightShoulder',
  'mixamorigRightArm',
  'mixamorigRightForeArm',
  'mixamorigRightHand',
  'mixamorigRightHandThumb1',
  'mixamorigRightHandThumb2',
  'mixamorigRightHandThumb3',
  'mixamorigRightHandThumb4',
  'mixamorigRightHandIndex1',
  'mixamorigRightHandIndex2',
  'mixamorigRightHandIndex3',
  'mixamorigRightHandIndex4',
  'mixamorigRightHandMiddle1',
  'mixamorigRightHandMiddle2',
  'mixamorigRightHandMiddle3',
  'mixamorigRightHandMiddle4',
  'mixamorigRightHandRing1',
  'mixamorigRightHandRing2',
  'mixamorigRightHandRing3',
  'mixamorigRightHandRing4',
  'mixamorigRightHandPinky1',
  'mixamorigRightHandPinky2',
  'mixamorigRightHandPinky3',
  'mixamorigRightHandPinky4',
];

const upperBodyBones = [
  'mixamorigSpine',
  'mixamorigSpine1',
  'mixamorigSpine2',
  ...headBones,
  ...leftArmBones,
  ...rightArmBones,
]
const lowerBodyBones = [
  'mixamorigRightUpLeg',
  'mixamorigRightLeg',
  'mixamorigRightFoot',
  'mixamorigRightToeBase',
  'mixamorigRightToe_End',
  'mixamorigLeftUpLeg',
  'mixamorigLeftLeg',
  'mixamorigLeftFoot',
  'mixamorigLeftToeBase',
  'mixamorigLeftToe_End',
]

function saveUpperBody() {
  showDropdown.value = false
  save(name => upperBodyBones.includes(name))
}

function saveLowerBody() {
  showDropdown.value = false
  save(name => lowerBodyBones.includes(name))
}
function saveHead() {
  showDropdown.value = false
  save(name => headBones.includes(name))
}
function saveLeftArm() {
  showDropdown.value = false
  save(name => leftArmBones.includes(name))
}
function saveRightArm() {
  showDropdown.value = false
  save(name => rightArmBones.includes(name))
}

function handleDropdownEnter() {
  if (dropdownHideTimer) {
    clearTimeout(dropdownHideTimer)
    dropdownHideTimer = null
  }
  showDropdown.value = true
}

function handleDropdownLeave() {
  dropdownHideTimer = setTimeout(() => {
    showDropdown.value = false
    dropdownHideTimer = null
  }, 200)
}
const loading = ref(false)
function playAnimation(file: string) {
  loading.value = true
  Promise.all([
    runPostAnimation('./pose/' + file),
    sleep(300)
  ]).then(() => {
    loading.value = false
  }).catch(() => {
    message.error('播放动画失败')
    loading.value = false
  })
}

function handleModalItemClick(file: string) {
  playAnimation(file)
  showModal.value = false
}
function runPostAnimation(file: string): Promise<void> {
  console.log('runPostAnimation', file)
  if (currentAction) {
    currentAction.stop()
  }
  return new Promise((resolve, reject) => {
    fbxLoader.load(file, (fbxScene: any) => {
      if (fbxScene.animations && fbxScene.animations.length > 0) {
        mixer = new THREE.AnimationMixer(fbxModel as THREE.Group)

        const clip = fbxScene.animations[0]
        currentAction = mixer.clipAction(clip, fbxModel as THREE.Group)
        totalDuration.value = clip.duration
        currentAction.play()
        isPlaying.value = true

        if (totalDuration.value < 0.06) {
          setTimeout(() => {
            currentAction!.paused = true
            isPlaying.value = false
          }, 30)
        }
        resolve()
        // console.log(`播放动画: ${clip.name}`)
      } else {
        reject()
        // console.log('FBX文件没有包含动画数据')
      }

      animate()
    }, () => {
      // const percent = (progress.loaded / progress.total * 100).toFixed(2)
      // console.log('FBX加载进度:', percent + '%')
    }, () => {
      // console.error('FBX文件加载失败:', error)
      animate()
    })
  })
}
function showModelPanel() {
  showModal.value = true
}
</script>
<style scoped lang="less">
.viewport-container {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 6px;
  // height: 100%;
  padding: 6px;
  overflow: hidden;
  position: relative;
  flex-wrap: nowrap;
}

.topPanel {
  .postList {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 4px;

    .item {
      top: 4px;
      left: 4px;
      padding: 5px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      z-index: 10;

      .name {
        font-size: 12px;
      }

      >img {
        width: 68px;
        height: 68px;
      }
    }

    .moreBtn {
      top: 4px;
      left: 4px;
      width: 78px;
      padding: 5px 10px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      z-index: 10;
      height: 102px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.viewport {
  position: relative;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 8px;
  overflow: hidden;

  .loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);

    >img {
      width: 32px;
      height: 32px;
      animation: loading 2s linear infinite;
    }

    @keyframes loading {
      0% {
        transform: rotate(0deg);
      }

      100% {
        transform: rotate(360deg);
      }
    }
  }
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
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .progressContainer {
    display: flex;
    width: 100%;
    flex-grow: 1;
    align-items: center;

    .progressBar {
      position: relative;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      overflow: visible;
      flex-grow: 1;

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
      margin-left: 8px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }

    .controlBtn {
      flex-shrink: 0;
      padding: 8px 12px;
      margin-left: 12px;
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

  .controlButtons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-left: 12px;
    flex-shrink: 0;

    .controlBtn {
      flex-shrink: 0;
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

    .dropdown-wrapper {
      position: relative;

      .dropdown-btn {
        padding: 8px 16px;
        font-size: 14px;
        height: 20px;
      }

      .dropdown-menu {
        position: absolute;
        bottom: calc(100% + 4px);
        right: 0;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        padding: 4px 0;
        min-width: 140px;
        z-index: 100;
        opacity: 1;
        pointer-events: auto;
        transition: opacity 0.2s;

        &.dropdown-menu-hidden {
          opacity: 0;
          pointer-events: none;
        }

        .dropdown-item {
          padding: 8px 16px;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          transition: background 0.2s;

          &:hover {
            background: #f5f5f5;
          }
        }
      }
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 80%;
  max-width: 760px;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  background: #f5f5f5;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.modal-close {
  font-size: 24px;
  cursor: pointer;
  color: #999;
  line-height: 1;

  &:hover {
    color: #666;
  }
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(70vh - 89px);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.modal-item {
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f0f0f0;
    border-color: #66b1ff;
  }

  .modal-item-name {
    font-size: 12px;
    display: block;
    text-align: center;
    margin-bottom: 4px;
  }

  img {
    width: 78px;
    height: 78px;
    display: block;
  }
}
</style>
