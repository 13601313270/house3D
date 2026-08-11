<template>
  <div class="viewport-container" ref="viewportRef">
    <div class="topPanel">
      <div class="postList">
        <div v-for="item in allDemoList.slice(0, 6)" :key="item.file" class="item" @click="playAnimation(item.file)">
          <div class="name">{{ item.name }}</div>
          <img :src="item.img" alt="animation" />
        </div>
      </div>
      <div class="postList">
        <div v-for="item in allDemoList.slice(6, 11)" :key="item.file" class="item" @click="playAnimation(item.file)">
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
          <div @click="togglePlay" class="controlBtn playBtn">
            {{ isPlaying ? '⏸' : '▶' }}
          </div>
        </div>
        <div class="optionsSection">
          <!-- <div class="optionGroup">
            <div class="optionGroupTitle">导出内容</div>
            <div class="optionRow">
              <label class="radioOption" :class="{ active: exportContent === 'currentFrame' }">
                <input type="radio" v-model="exportContent" value="currentFrame" hidden />
                <span class="radioDot"></span>
                <span>当前帧</span>
              </label>
              <label class="radioOption" :class="{ active: exportContent === 'wholeAnimation' }">
                <input type="radio" v-model="exportContent" value="wholeAnimation" hidden />
                <span class="radioDot"></span>
                <span>整个动画</span>
              </label>
            </div>
          </div> -->
          <div class="optionGroup">
            <div class="optionGroupTitle">应用范围</div>
            <div class="optionRow">
              <label class="radioOption" :class="{ active: applyScope === 'fullBody' }">
                <input type="radio" v-model="applyScope" value="fullBody" hidden />
                <span class="radioDot"></span>
                <span>全身</span>
              </label>
              <label class="radioOption" :class="{ active: applyScope === 'upperBody' }">
                <input type="radio" v-model="applyScope" value="upperBody" hidden />
                <span class="radioDot"></span>
                <span>上半身</span>
              </label>
              <label class="radioOption" :class="{ active: applyScope === 'lowerBody' }">
                <input type="radio" v-model="applyScope" value="lowerBody" hidden />
                <span class="radioDot"></span>
                <span>下半身</span>
              </label>
              <label class="radioOption" :class="{ active: applyScope === 'head' }">
                <input type="radio" v-model="applyScope" value="head" hidden />
                <span class="radioDot"></span>
                <span>头部</span>
              </label>
              <label class="radioOption" :class="{ active: applyScope === 'leftArm' }">
                <input type="radio" v-model="applyScope" value="leftArm" hidden />
                <span class="radioDot"></span>
                <span>左臂</span>
              </label>
              <label class="radioOption" :class="{ active: applyScope === 'rightArm' }">
                <input type="radio" v-model="applyScope" value="rightArm" hidden />
                <span class="radioDot"></span>
                <span>右臂</span>
              </label>
            </div>
          </div>
        </div>
        <div class="applyBtn" @click="handleApply">应用</div>
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
import { timelineState } from '@/utils/timelineManage'
import generateClipId from '@/utils/generateClipId'

const viewportRef = ref<HTMLDivElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

let scene = new THREE.Scene()
let animationId: number | null = null
let mixer: THREE.AnimationMixer | null = null
const clock = new THREE.Clock()
let rootBone: THREE.Object3D | null = null
const originalPosition = new THREE.Vector3()

const showModal = ref(false)

// 导出内容：当前帧 / 整个动画
type ExportContent = 'currentFrame' | 'wholeAnimation'
const exportContent = ref<ExportContent>('currentFrame')

// 应用范围：全身 / 上半身 / 下半身 / 头部 / 左臂 / 右臂
type ApplyScope = 'fullBody' | 'upperBody' | 'lowerBody' | 'head' | 'leftArm' | 'rightArm'
const applyScope = ref<ApplyScope>('fullBody')

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
const viewportConfigs: ViewportConfig = {
  id: 'main',
  type: 'perspective',
  position: [-300, 300, 400],
  fov: 45,
  aspect: 2,
  getContainer: () => containerRef.value
};

let allPanel: {
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
}
let controls: OrbitControls | null = null
const allPanelWidth = ref(0)
const allPanelHeight = ref(0)

const fbxLoader = new FBXLoader()
let peopleModel: THREE.Group | null = null

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
  const config: ViewportConfig = viewportConfigs
  const camera: THREE.Camera = new THREE.PerspectiveCamera(config.fov || 45, config.aspect || 1, 0.1, 2000)
  camera.position.set(...config.position)
  camera.lookAt(0, 100, 0)
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true

  const container = config.getContainer() || document.createElement('div')
  container.style.width = `${allPanelWidth.value - 2}px`
  container.style.height = `${allPanelHeight.value - 2}px`
  renderer.setSize(allPanelWidth.value - 2, allPanelHeight.value - 2)

  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 100, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = false
  allPanel = {
    camera,
    renderer,
  }

  fbxLoader.load('/ManClean.fbx', (fbxModel_: any) => {
    console.log('FBX模型加载成功:', fbxModel_)
    peopleModel = fbxModel_ as THREE.Group

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
    peopleModel.traverse((child: any) => {
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

    const box = new THREE.Box3().setFromObject(peopleModel)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    console.log('模型包围盒 - 中心:', center, '尺寸:', size)

    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 200 / maxDim
    peopleModel.scale.set(scale, scale, scale)
    console.log('模型缩放:', scale)

    rootBone = peopleModel.getObjectByName('Armature') || peopleModel.children[0]
    originalPosition.copy(rootBone.position)

    scene.add(peopleModel)

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
  const panel = allPanel
  panel.renderer.render(scene, panel.camera!)
}

onMounted(() => {
  if (!viewportRef.value) return
  allPanelWidth.value = 594
  allPanelHeight.value = 297;
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
  allPanel.renderer.dispose()
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

async function saveAnimation(boneFilter?: (name: string) => boolean) {
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
  const addTimes = [
    {
      saveVal: JSON.parse(JSON.stringify(saveVal)),
      time: timelineState.currentTime,
    }
  ]
  const timeDiff = 0.5
  if (currentAction) {
    currentAction.time += timeDiff;
  }
  await sleep(100);
  (() => {
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
    addTimes.push({
      saveVal: JSON.parse(JSON.stringify(saveVal)),
      time: timelineState.currentTime + timeDiff,
    })
  })();
  const originalData = window.editPropEntity.getOriginalData();
  let findClip = timelineState.timelineData.clips.find(v => v.entityId === originalData.id);
  if (!findClip) {
    timelineState.timelineData.clips.push({
      entityId: originalData.id,
      clipId: generateClipId(),
      startTime: timelineState.currentTime,
      endTime: timelineState.currentTime + 1,
      columns: [],
    })
    findClip = timelineState.timelineData.clips.find(v => v.entityId === originalData.id)
  }
  console.log('findClip', findClip);
  if (findClip) {
    const key = 'bone';
    addTimes.forEach(timeParams => {
      const findTrack = findClip.columns.find(v => v.trackType === key)
      if (findTrack) {
        const keyTimePoints = [...findTrack.keyTimePoints];
        // console.log(222222, keyTimePoints)
        if (keyTimePoints.find(v => v.time === timeParams.time)) {
          const index = keyTimePoints.findIndex(v => v.time === timeParams.time)
          // @ts-ignore
          keyTimePoints[index].value = timeParams.saveVal
          findTrack.keyTimePoints = keyTimePoints;
        } else {
          keyTimePoints.push({
            time: timeParams.time,
            // @ts-ignore
            value: timeParams.saveVal,
          })
          findTrack.keyTimePoints = keyTimePoints.sort((a, b) => a.time - b.time);
        }
      } else {
        findClip.columns.push({
          trackType: key,
          keyTimePoints: [{
            time: timeParams.time,
            // @ts-ignore
            value: timeParams.saveVal,
          }]
        })
      }

      // 如果timelineState.currentTime，在findClip.startTime和findClip.endTime之外，那么调整findClip.startTime和findClip.endTime，包括进这个时间
      if (timeParams.time < findClip.startTime) {
        findClip.startTime = timeParams.time;
      }
      if (timeParams.time > findClip.endTime) {
        findClip.endTime = timeParams.time;
      }
    })

    // this.setAnimationData({
    //   ...this.animationData,
    //   ...data,
    // })

    timelineState.timelineData = {
      ...timelineState.timelineData
    };
  }
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
  'mixamorigHips',
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

function getBoneFilter(scope: ApplyScope): ((name: string) => boolean) | undefined {
  switch (scope) {
    case 'fullBody':
      return undefined
    case 'upperBody':
      return (name: string) => upperBodyBones.includes(name)
    case 'lowerBody':
      return (name: string) => lowerBodyBones.includes(name)
    case 'head':
      return (name: string) => headBones.includes(name)
    case 'leftArm':
      return (name: string) => leftArmBones.includes(name)
    case 'rightArm':
      return (name: string) => rightArmBones.includes(name)
  }
}

function handleApply() {
  const boneFilter = getBoneFilter(applyScope.value)

  if (exportContent.value === 'currentFrame') {
    // 当前帧模式：复用现有 save 逻辑
    save(boneFilter)
  } else {
    saveAnimation(boneFilter)
  }
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
        mixer = new THREE.AnimationMixer(peopleModel!)

        const clip = fbxScene.animations[0]
        currentAction = mixer.clipAction(clip, peopleModel!)
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
      padding: 5px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      z-index: 10;
      position: relative;
      width: 80px;
      height: 80px;
      box-sizing: border-box;

      .name {
        font-size: 12px;
        text-align: center;
        position: absolute;
        top: 6px;
        left: 5px;
        color: white;
        background: #0000004f;
        padding: 2px;
      }

      >img {
        width: 68px;
        height: 68px;
      }
    }

    .moreBtn {
      width: 80px;
      height: 80px;
      padding: 5px 10px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      z-index: 10;
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
  background: #fff;
  border-top: 1px solid #e5e7eb;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .progressContainer {
    display: flex;
    width: 100%;
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
        background: #2563eb;
        border-radius: 4px;
        transition: width 0.1s;
      }

      .progressThumb {
        position: absolute;
        top: 50%;
        width: 16px;
        height: 16px;
        background: #2563eb;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: left 0.1s;
      }
    }

    .timeDisplay {
      margin-left: 12px;
      text-align: center;
      font-size: 14px;
      color: #374151;
      min-width: 90px;
    }

    .controlBtn.playBtn {
      flex-shrink: 0;
      margin-left: 12px;
      border: none;
      border-radius: 8px;
      background: #2563eb;
      color: white;
      cursor: pointer;
      font-size: 16px;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #3b82f6;
      }

      &:active {
        transform: scale(0.96);
      }
    }
  }

  .optionsSection {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 8px;

    .optionGroup {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 4px;

      .optionGroupTitle {
        font-size: 16px;
        font-weight: 500;
        color: #111827;
      }

      .optionRow {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .radioOption {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: all 0.2s;
          background: #fff;

          &:hover {
            border-color: #9ca3af;
          }

          .radioDot {
            width: 16px;
            height: 16px;
            border: 1.5px solid #9ca3af;
            border-radius: 50%;
            position: relative;
            flex-shrink: 0;
            transition: all 0.2s;

            &::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 8px;
              height: 8px;
              background: #2563eb;
              border-radius: 50%;
              transition: transform 0.2s;
            }
          }

          &.active {
            border-color: #2563eb;
            background: #eff6ff;
            color: #1d4ed8;

            .radioDot {
              border-color: #2563eb;

              &::after {
                transform: translate(-50%, -50%) scale(1);
              }
            }
          }
        }
      }
    }
  }

  .applyBtn {
    width: 100%;
    padding: 4px 0;
    background: #2563eb;
    color: white;
    font-size: 20px;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;

    &:hover {
      background: #3b82f6;
    }

    &:active {
      transform: scale(0.99);
    }
  }

  .applyHint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;

    .hintIcon {
      color: #9ca3af;
      font-size: 14px;
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
