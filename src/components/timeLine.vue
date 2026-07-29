<template>
  <div class="timeline-container">
    <div class="timeline-header">
      <div class="header-left">
        <span class="title">时间轴</span>
        <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(timelineData.duration) }}</span>
      </div>
      <div class="header-right">
        <button class="control-btn" @click="stop">⏹</button>
        <button class="control-btn" @click="togglePlay">{{ isPlaying ? '⏸' : '▶' }}</button>
        <input type="range" class="speed-control" v-model="playbackSpeed" min="0.1" max="3" step="0.1" />
        <span class="speed-label">{{ playbackSpeed }}倍速</span>
        <button class="control-btn" @click="zoomIn">+</button>
        <button class="control-btn" @click="zoomOut">−</button>
        <span class="speed-label">{{ Math.round(zoomLevel * 100) }}%</span>
      </div>
    </div>

    <div class="timeline-scroll-container" @scroll="onScroll">
      <div class="timeline-content-wrapper" :style="{ width: `${timelineData.duration * zoomLevel * 50}px` }"
        @click="handleWrapperClick">
        <div class="timeline-track-area">
          <div class="track-list">
            <div v-for="clip in timelineData.clips" :key="clip.entityId" class="track-item"
              :class="{ collapsed: collapsedClips.has(clip.entityId) }">
              <div class="track-header" @click="toggleCollapse(clip.entityId)">
                <span class="collapse-icon">{{ collapsedClips.has(clip.entityId) ? '▶' : '▼' }}</span>
                <span class="entity-name">{{ clip.entityId }}</span>
                <span class="track-count">{{ clip.tracks.length }} 轨道</span>
              </div>
              <div class="track-content" v-show="!collapsedClips.has(clip.entityId)">
                <div v-for="track in clip.tracks" :key="track.trackType" class="track-row">
                  <div class="track-label">{{ translateTrackType(track.trackType) }}</div>
                  <div class="track-timeline" @click="handleTrackClick($event, track)">
                    <div class="track-background">
                      <svg class="curve-line" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <polyline :points="getCurvePoints(track)" fill="none" stroke="#4CAF50" stroke-width="1" />
                      </svg>
                      <div v-for="keyframe in track.keyframes" :key="keyframe.time" class="keyframe-node"
                        :style="{ left: `${(keyframe.time / timelineData.duration) * 100}%` }"
                        @click.stop="selectKeyframe(clip.entityId, track.trackType, keyframe)"
                        :class="{ selected: isKeyframeSelected(clip.entityId, track.trackType, keyframe) }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="timeline-ruler">
          <div class="ruler-track">
            <div class="ruler-marks">
              <div v-for="mark in rulerMarks" :key="mark.time" class="ruler-mark" :class="{ major: mark.major }"
                :style="{ left: `${(mark.time / timelineData.duration) * 100}%` }">
                <span v-if="mark.major" class="mark-label">{{ formatTime(mark.time) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="playhead-container">
          <div class="playhead-line" :style="{ left: `${(currentTime / timelineData.duration) * 100}%` }"></div>
          <div class="playhead-handle" :style="{ left: `calc(${(currentTime / timelineData.duration) * 100}% - 6px)` }"
            @mousedown="startDragging"></div>
        </div>
      </div>
    </div>

    <div v-if="selectedKeyframe" class="keyframe-panel">
      <div class="panel-header">关键帧属性</div>
      <div class="panel-content">
        <div class="property-row">
          <label>时间:</label>
          <input type="number" v-model.number="selectedKeyframe.keyframe.time" step="0.1" />
        </div>
        <div class="property-row">
          <label>值:</label>
          <input type="text" v-model="selectedKeyframeValue" />
        </div>
        <div class="property-row">
          <label>缓动:</label>
          <select v-model="selectedKeyframe.keyframe.easing">
            <option value="linear">线性</option>
            <option value="easeIn">缓入</option>
            <option value="easeOut">缓出</option>
            <option value="easeInOut">缓入缓出</option>
          </select>
        </div>
      </div>
    </div>

    <div class="demo-controls">
      <button class="demo-btn" @click="addCube">+ 添加动画立方体</button>
      <button class="demo-btn" @click="clearAll">清空全部</button>
      <button class="demo-btn" @click="saveAnimation">保存 JSON</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

type TrackType = 'position' | 'rotation' | 'scale' | 'visible' | 'opacity'

interface Keyframe {
  time: number
  value: any
  easing?: string
}

interface TrackData {
  trackType: TrackType
  keyframes: Keyframe[]
  interpolation?: 'linear' | 'step' | 'bezier'
}

interface ClipData {
  entityId: string
  tracks: TrackData[]
}

interface TimelineData {
  duration: number
  clips: ClipData[]
}

const timelineData = ref<TimelineData>({
  duration: 10,
  clips: []
})

const currentTime = ref(0)
const isPlaying = ref(false)
const playbackSpeed = ref(1)
const selectedKeyframe = ref<{ entityId: string; trackType: TrackType; keyframe: Keyframe } | null>(null)
const selectedKeyframeValue = ref('')
const zoomLevel = ref(1)
const scrollLeft = ref(0)
const collapsedClips = ref<Set<string>>(new Set())

let animationFrameId: number | null = null
let lastTimestamp = 0
let isDragging = false

const rulerMarks = computed(() => {
  const marks = []
  const step = timelineData.value.duration / 20
  for (let i = 0; i <= timelineData.value.duration; i += step) {
    marks.push({
      time: i,
      major: i % 1 === 0
    })
  }
  return marks
})

function formatTime(time: number): string {
  const seconds = Math.floor(time)
  const milliseconds = Math.floor((time - seconds) * 100)
  return `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`
}

function translateTrackType(type: TrackType): string {
  const translations: Record<TrackType, string> = {
    position: '位置',
    rotation: '旋转',
    scale: '缩放',
    visible: '可见',
    opacity: '透明度'
  }
  return translations[type] || type
}

function getTrackColor(type: TrackType): string {
  const colors: Record<TrackType, string> = {
    position: '#4CAF50',
    rotation: '#2196F3',
    scale: '#FF9800',
    visible: '#9C27B0',
    opacity: '#E91E63'
  }
  return colors[type] || '#ffffff'
}

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.2, 5)
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.2, 0.2)
}

function handleWrapperClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('.keyframe-node') || target.closest('.track-timeline') || target.closest('.track-header')) {
    return
  }

  const wrapper = document.querySelector('.timeline-content-wrapper') as HTMLElement
  if (!wrapper) return

  const rect = wrapper.getBoundingClientRect()
  const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
  const time = (x / rect.width) * timelineData.value.duration

  currentTime.value = Math.max(0, Math.min(time, timelineData.value.duration))
  evaluateTimeline(currentTime.value)
}

function onScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollLeft.value = target.scrollLeft
}

function toggleCollapse(entityId: string) {
  const next = new Set(collapsedClips.value)
  if (next.has(entityId)) {
    next.delete(entityId)
  } else {
    next.add(entityId)
  }
  collapsedClips.value = next
}

function getCurvePoints(track: TrackData): string {
  if (track.keyframes.length < 2) return ''

  const points = track.keyframes
    .sort((a, b) => a.time - b.time)
    .map(kf => {
      const x = (kf.time / timelineData.value.duration) * 100
      let y = 10
      if (track.trackType === 'opacity') {
        y = 18 - kf.value * 16
      } else if (track.trackType === 'visible') {
        y = kf.value ? 4 : 16
      } else if (Array.isArray(kf.value)) {
        y = 18 - (kf.value[1] / 10) * 14
      }
      return `${x},${y}`
    })

  return points.join(' ')
}

function isKeyframeSelected(entityId: string, trackType: TrackType, keyframe: Keyframe): boolean {
  return selectedKeyframe.value?.entityId === entityId &&
    selectedKeyframe.value?.trackType === trackType &&
    selectedKeyframe.value?.keyframe === keyframe
}

function selectKeyframe(entityId: string, trackType: TrackType, keyframe: Keyframe) {
  selectedKeyframe.value = { entityId, trackType, keyframe }
  selectedKeyframeValue.value = typeof keyframe.value === 'object' ? JSON.stringify(keyframe.value) : String(keyframe.value)
}

function handleTrackClick(event: MouseEvent, track: TrackData) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const time = (x / rect.width) * timelineData.value.duration

  let defaultValue: any = null
  switch (track.trackType) {
    case 'position':
      defaultValue = { x: 0, y: 0, z: 0 }
      break
    case 'rotation':
      defaultValue = { x: 0, y: 0, z: 0 }
      break
    case 'scale':
      defaultValue = { x: 1, y: 1, z: 1 }
      break
    case 'visible':
      defaultValue = true
      break
    case 'opacity':
      defaultValue = 1
      break
  }

  const newKeyframe: Keyframe = {
    time: Math.round(time * 10) / 10,
    value: defaultValue,
    easing: 'linear'
  }

  track.keyframes.push(newKeyframe)
  track.keyframes.sort((a, b) => a.time - b.time)

  selectKeyframe('', track.trackType, newKeyframe)
}

function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    lastTimestamp = performance.now()
    playLoop()
  } else if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function stop() {
  isPlaying.value = false
  currentTime.value = 0
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  evaluateTimeline(0)
}

function playLoop() {
  if (!isPlaying.value) return

  const now = performance.now()
  const deltaTime = (now - lastTimestamp) / 1000
  lastTimestamp = now

  currentTime.value += deltaTime * playbackSpeed.value

  if (currentTime.value >= timelineData.value.duration) {
    currentTime.value = 0
  }

  evaluateTimeline(currentTime.value)

  animationFrameId = requestAnimationFrame(playLoop)
}

function startDragging(e: MouseEvent) {
  isDragging = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDragging)
  onDrag(e)
}

function onDrag(e: MouseEvent) {
  if (!isDragging) return

  const wrapper = document.querySelector('.timeline-content-wrapper') as HTMLElement
  if (!wrapper) return

  const rect = wrapper.getBoundingClientRect()
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  const time = (x / rect.width) * timelineData.value.duration

  currentTime.value = Math.max(0, Math.min(time, timelineData.value.duration))
  evaluateTimeline(currentTime.value)
}

function stopDragging() {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
}

const animatedObjects = new Map<string, THREE.Mesh>()

function evaluateTimeline(time: number) {
  timelineData.value.clips.forEach(clip => {
    const obj = animatedObjects.get(clip.entityId)
    if (!obj) return

    clip.tracks.forEach(track => {
      const value = evaluateTrack(track, time)
      applyTrackValue(obj, track.trackType, value)
    })
  })
}

function evaluateTrack(track: TrackData, time: number): any {
  if (track.keyframes.length === 0) return null
  if (track.keyframes.length === 1) return track.keyframes[0].value

  const sortedKeyframes = [...track.keyframes].sort((a, b) => a.time - b.time)

  if (time <= sortedKeyframes[0].time) return sortedKeyframes[0].value
  if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) return sortedKeyframes[sortedKeyframes.length - 1].value

  let leftIndex = 0
  let rightIndex = sortedKeyframes.length - 1

  while (leftIndex < rightIndex - 1) {
    const midIndex = Math.floor((leftIndex + rightIndex) / 2)
    if (sortedKeyframes[midIndex].time <= time) {
      leftIndex = midIndex
    } else {
      rightIndex = midIndex
    }
  }

  const leftKeyframe = sortedKeyframes[leftIndex]
  const rightKeyframe = sortedKeyframes[rightIndex]

  const totalDuration = rightKeyframe.time - leftKeyframe.time
  let t = (time - leftKeyframe.time) / totalDuration

  if (leftKeyframe.easing) {
    t = applyEasing(t, leftKeyframe.easing)
  }

  return interpolateValues(leftKeyframe.value, rightKeyframe.value, t, track.trackType)
}

function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'easeIn': return t * t
    case 'easeOut': return t * (2 - t)
    case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    default: return t
  }
}

function interpolateValues(a: any, b: any, t: number, trackType: TrackType): any {
  if (trackType === 'visible') {
    return t >= 0.5 ? b : a
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a + (b - a) * t
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map((val: number, i: number) => val + (b[i] - val) * t)
  }

  if (a instanceof THREE.Vector3 && b instanceof THREE.Vector3) {
    return new THREE.Vector3().lerpVectors(a, b, t)
  }

  if (a instanceof THREE.Quaternion && b instanceof THREE.Quaternion) {
    return new THREE.Quaternion().slerpQuaternions(a, b, t)
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const result: any = {}
    for (const key in a) {
      if (Object.prototype.hasOwnProperty.call(b, key)) {
        result[key] = interpolateValues(a[key], b[key], t, trackType)
      }
    }
    return result
  }

  return b
}

function applyTrackValue(obj: THREE.Mesh, trackType: TrackType, value: any) {
  if (!value) return

  switch (trackType) {
    case 'position':
      if (typeof value === 'object') {
        obj.position.set(value.x || 0, value.y || 0, value.z || 0)
      }
      break
    case 'rotation':
      if (typeof value === 'object') {
        obj.rotation.set(value.x || 0, value.y || 0, value.z || 0)
      }
      break
    case 'scale':
      if (typeof value === 'object') {
        obj.scale.set(value.x || 1, value.y || 1, value.z || 1)
      }
      break
    case 'visible':
      obj.visible = !!value
      break
    case 'opacity':
      if (obj.material instanceof THREE.MeshBasicMaterial) {
        obj.material.opacity = value
        obj.material.transparent = value < 1
      } else if (obj.material instanceof THREE.MeshStandardMaterial) {
        obj.material.opacity = value
        obj.material.transparent = value < 1
      }
      break
  }
}

function addCube() {
  const scene = (window as any).worldApi?.scene
  if (!scene) return

  const id = `cube-${Date.now()}`

  const geometry = new THREE.BoxGeometry(50, 50, 50)
  const material = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    transparent: true,
    opacity: 1
  })
  const cube = new THREE.Mesh(geometry, material)
  cube.position.set(Math.random() * 100 - 50, 25, Math.random() * 100 - 50)
  cube.castShadow = true
  cube.receiveShadow = true

  scene.add(cube)
  animatedObjects.set(id, cube)

  timelineData.value.clips.push({
    entityId: id,
    tracks: [
      {
        trackType: 'position',
        keyframes: [
          { time: 0, value: { x: cube.position.x, y: cube.position.y, z: cube.position.z }, easing: 'easeInOut' },
          { time: 5, value: { x: cube.position.x + 100, y: cube.position.y + 50, z: cube.position.z }, easing: 'easeInOut' },
          { time: 10, value: { x: cube.position.x, y: cube.position.y, z: cube.position.z }, easing: 'easeInOut' }
        ],
        interpolation: 'linear'
      },
      {
        trackType: 'rotation',
        keyframes: [
          { time: 0, value: { x: 0, y: 0, z: 0 }, easing: 'linear' },
          { time: 5, value: { x: Math.PI, y: Math.PI, z: 0 }, easing: 'linear' },
          { time: 10, value: { x: Math.PI * 2, y: Math.PI * 2, z: 0 }, easing: 'linear' }
        ],
        interpolation: 'linear'
      },
      {
        trackType: 'opacity',
        keyframes: [
          { time: 0, value: 1, easing: 'linear' },
          { time: 8, value: 0.3, easing: 'easeOut' },
          { time: 10, value: 1, easing: 'easeIn' }
        ],
        interpolation: 'linear'
      }
    ]
  })
}

function clearAll() {
  const scene = (window as any).worldApi?.scene
  if (!scene) return

  animatedObjects.forEach(obj => {
    scene.remove(obj)
    obj.geometry.dispose()
    if (obj.material instanceof THREE.Material) {
      obj.material.dispose()
    }
  })
  animatedObjects.clear()
  timelineData.value.clips = []
  currentTime.value = 0
  selectedKeyframe.value = null
}

function saveAnimation() {
  const data = JSON.stringify(timelineData.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'animation.json'
  a.click()
  URL.revokeObjectURL(url)
}

watch(selectedKeyframeValue, (val) => {
  if (selectedKeyframe.value) {
    try {
      const parsed = JSON.parse(val)
      selectedKeyframe.value.keyframe.value = parsed
    } catch {
      selectedKeyframe.value.keyframe.value = val
    }
  }
})

onMounted(() => {
  addCube()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
})
</script>

<style scoped lang="less">
.timeline-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  // background: #1a1a2e;
  // border-radius: 8px;
  overflow: hidden;
  font-family: 'Segoe UI', sans-serif;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  // background: #16213e;
  border-bottom: 1px solid #0f3460;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #e94560;
}

.time-display {
  font-size: 14px;
  color: #a8b2d1;
  font-family: monospace;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #0f3460;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1a4d7a;
  }
}

.speed-control {
  width: 80px;
  height: 6px;
  cursor: pointer;
}

.speed-label {
  font-size: 12px;
  color: #a8b2d1;
  min-width: 30px;
}

.timeline-scroll-container {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  position: relative;
}

.timeline-content-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 100%;
}

.timeline-track-area {
  overflow-y: auto;
  box-sizing: border-box;
  position: relative;
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.track-item {
  // background: #16213e;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #1a4d7a;
}

.track-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #0f3460;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: #1a4d7a;
  }
}

.collapse-icon {
  font-size: 10px;
  color: #a8b2d1;
  width: 12px;
  flex-shrink: 0;
}

.entity-name {
  font-size: 13px;
  color: #e94560;
  font-weight: 500;
  flex: 1;
}

.track-count {
  font-size: 12px;
  color: #6b7280;
}

.track-content {
  // padding: 4px 0;
}

.track-row {
  display: flex;
  align-items: center;
  height: 36px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.track-label {
  width: 70px;
  padding: 0 12px;
  font-size: 12px;
  color: #a8b2d1;
  text-align: right;
  flex-shrink: 0;
}

.track-timeline {
  flex: 1;
  position: relative;
  height: 100%;
  cursor: crosshair;
}

.track-background {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.02);
}

.keyframe-node {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  margin-top: -6px;
  border-radius: 50%;
  background: #4CAF50;
  border: 2px solid #fff;
  cursor: move;
  transition: transform 0.15s, background 0.15s;
  z-index: 2;

  &:hover {
    transform: scale(1.3);
  }

  &.selected {
    background: #e94560;
    transform: scale(1.3);
  }
}

.curve-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.timeline-ruler {
  height: 40px;
  background: #0f3460;
  border-top: 1px solid #1a4d7a;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  margin-left: 100px;
}

.ruler-track {
  position: relative;
  width: 100%;
  height: 100%;
}

.playhead-container {
  position: absolute;
  top: 0;
  left: 100px;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.playhead-line {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: rgba(233, 69, 96, 0.6);
  pointer-events: none;
  box-shadow: 0 0 6px rgba(233, 69, 96, 0.3);
}

.playhead-handle {
  position: absolute;
  bottom: 40px;
  width: 12px;
  height: 12px;
  background: #e94560;
  cursor: ew-resize;
  pointer-events: auto;
  z-index: 101;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  transform: translateX(0);

  &:hover {
    background: #ff5c7a;
    transform: scale(1.2) translateX(0);
  }
}

.ruler-marks {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.ruler-mark {
  position: absolute;
  top: 0;
  width: 1px;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);

  &.major {
    height: 100%;
    background: rgba(255, 255, 255, 0.4);

    .mark-label {
      position: absolute;
      top: 4px;
      left: 2px;
      font-size: 10px;
      color: #a8b2d1;
      white-space: nowrap;
    }
  }
}

.keyframe-panel {
  padding: 12px;
  background: #16213e;
  border-top: 1px solid #0f3460;
}

.panel-header {
  font-size: 13px;
  font-weight: 500;
  color: #e94560;
  margin-bottom: 8px;
}

.panel-content {
  display: flex;
  gap: 16px;
}

.property-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-row label {
  font-size: 12px;
  color: #6b7280;
}

.property-row input,
.property-row select {
  padding: 4px 8px;
  border: 1px solid #0f3460;
  border-radius: 4px;
  background: #0f3460;
  color: #fff;
  font-size: 12px;
}

.demo-controls {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #16213e;
  border-top: 1px solid #0f3460;
}

.demo-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #0f3460;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1a4d7a;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #16213e;
}

::-webkit-scrollbar-thumb {
  background: #0f3460;
  border-radius: 3px;

  &:hover {
    background: #1a4d7a;
  }
}
</style>