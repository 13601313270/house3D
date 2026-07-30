<template>
  <div class="timeline-container">
    <div class="timeline-header">
      <div class="header-left">
        <span class="title">时间轴</span>
        <span class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(effectiveDuration) }}</span>
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
    <div class="timeline-ruler" ref="timelineRuler" @scroll.prevent.stop>
      <div class="ruler-track" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
        <div class="ruler-marks">
          <div v-for="mark in rulerMarks" :key="mark.time" class="ruler-mark" :class="{ major: mark.major }"
            :style="{ left: `${(mark.time / effectiveDuration) * 100}%` }">
            <span v-if="mark.major" class="mark-label">{{ formatTime(mark.time) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="timeline-scroll-container" @scroll="onScroll">
      <div class="timeInfo" @mousedown="handleTimeInfoMouseDown">
        <div class="timeline-content-wrapper" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
          <div class="timeline-track-area">
            <div v-for="(row, rowIndex) in rowsByIndex" :key="`time-row-${rowIndex}`" class="timeline-row">
              <div v-for="segment in row" :key="segment.clip.entityId" class="track-item"
                :class="{ active: activeClipId === segment.clip.entityId }"
                :style="{
                  left: `${(segment.startTime / effectiveDuration) * 100}%`,
                  width: `${((segment.endTime - segment.startTime) / effectiveDuration) * 100}%`
                }" @mousedown="startClipDrag($event, segment.clip.entityId)" @click.stop="toggleClipContent($event, segment)">
                <div class="track-header-bar">
                  <span class="clip-name">{{ segment.clip.entityId }}</span>
                  <span class="clip-duration">{{ formatTime(segment.startTime) }} - {{ formatTime(segment.endTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="playhead-container" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
          <div class="playhead-line" :style="{ left: `${(currentTime / effectiveDuration) * 100}%` }"
            @mousedown="startDragging"></div>
        </div>
      </div>
    </div>

    <teleport to="#teleport" v-if="activeSegment">
      <div class="track-content-floating" :style="trackContentStyle" @click.stop>
        <div class="floating-header">
          <span class="floating-title">{{ activeSegment.clip.entityId }}</span>
          <span class="floating-time">{{ formatTime(activeSegment.startTime) }} - {{ formatTime(activeSegment.endTime) }}</span>
          <button class="floating-close" @click="closeClipContent">×</button>
        </div>
        <div v-for="track in activeSegment.clip.tracks" :key="track.trackType" class="track-row">
          <div class="track-label">{{ translateTrackType(track.trackType) }}</div>
          <div class="track-timeline" @click="handleTrackClick($event, track, activeSegment)">
            <div class="track-background">
              <svg class="curve-line" viewBox="0 0 100 20" preserveAspectRatio="none">
                <polyline :points="getCurvePoints(track, activeSegment)" fill="none" stroke="#4CAF50"
                  stroke-width="1" />
              </svg>
              <div v-for="keyframe in track.keyframes" :key="keyframe.time" class="keyframe-node"
                :style="{ left: `${((keyframe.time - activeSegment.startTime) / (activeSegment.endTime - activeSegment.startTime || 1)) * 100}%` }"
                @click.stop="selectKeyframe(activeSegment.clip.entityId, track.trackType, keyframe)"
                :class="{ selected: isKeyframeSelected(activeSegment.clip.entityId, track.trackType, keyframe) }">
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <div v-if="selectedKeyframe" class="keyframe-panel">
      <div class="panel-header">关键帧属性</div>
      <div class="panel-content">
        <div class="property-row">
          <label>时间:</label>
          <input type="number" v-model.number="selectedKeyframe.keyframe.time" step="0.1" @change="syncTimelineData" />
        </div>
        <div class="property-row">
          <label>值:</label>
          <input type="text" v-model="selectedKeyframeValue" />
        </div>
        <div class="property-row">
          <label>缓动:</label>
          <select v-model="selectedKeyframe.keyframe.easing" @change="syncTimelineData">
            <option value="linear">线性</option>
            <option value="easeIn">缓入</option>
            <option value="easeOut">缓出</option>
            <option value="easeInOut">缓入缓出</option>
          </select>
        </div>
      </div>
    </div>

    <div class="demo-controls">
      <button class="demo-btn" @click="clearAll">清空全部</button>
      <button class="demo-btn" @click="saveAnimation">保存 JSON</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onUnmounted, watch } from 'vue'
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

interface ClipSegment {
  clip: ClipData
  startTime: number
  endTime: number
  rowIndex: number
}

export interface TimelineData {
  duration: number
  clips: ClipData[]
}

const props = defineProps<{
  modelValue: TimelineData
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TimelineData): void
}>()

const timelineData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const effectiveDuration = computed(() => {
  let maxTime = timelineData.value.duration
  for (const clip of timelineData.value.clips) {
    for (const track of clip.tracks) {
      for (const kf of track.keyframes) {
        if (kf.time > maxTime) maxTime = kf.time
      }
    }
  }
  return Math.max(maxTime + 5, 30)
})

const timelineRuler = ref();
const currentTime = ref(0)
const isPlaying = ref(false)
const playbackSpeed = ref(1)
const selectedKeyframe = ref<{ entityId: string; trackType: TrackType; keyframe: Keyframe } | null>(null)
const selectedKeyframeValue = ref('')
const zoomLevel = ref(1)
const scrollLeft = ref(0)
const collapsedClips = ref<Set<string>>(new Set())
const activeClipId = ref<string | null>(null)
const activeSegment = ref<ClipSegment | null>(null)
const trackContentStyle = ref<Record<string, string>>({})

let animationFrameId: number | null = null
let lastTimestamp = 0
let isDragging = false
let isDraggingClip = false
let dragClipId: string | null = null
let dragStartX = 0
let dragMoved = false
const dragStartTimes = new Map<string, number[]>()
let isScrubbing = false
let scrubClosedPanel = false

const rulerMarks = computed(() => {
  const marks = []
  const dur = effectiveDuration.value
  const step = dur / 20
  for (let i = 0; i <= dur; i += step) {
    marks.push({
      time: i,
      major: i % 1 === 0
    })
  }
  return marks
})

const clipSegments = computed<ClipSegment[]>(() => {
  const segments: ClipSegment[] = []

  for (const clip of timelineData.value.clips) {
    const allTimes: number[] = []
    for (const track of clip.tracks) {
      for (const kf of track.keyframes) {
        allTimes.push(kf.time)
      }
    }

    if (allTimes.length === 0) continue

    const startTime = Math.min(...allTimes)
    const endTime = Math.max(...allTimes)

    segments.push({
      clip,
      startTime,
      endTime,
      rowIndex: 0
    })
  }

  segments.sort((a, b) => a.startTime - b.startTime)

  const rowEndTimes: number[] = []

  for (const segment of segments) {
    let assignedRow = -1

    for (let r = 0; r < rowEndTimes.length; r++) {
      if (rowEndTimes[r] <= segment.startTime) {
        assignedRow = r
        break
      }
    }

    if (assignedRow === -1) {
      assignedRow = rowEndTimes.length
      rowEndTimes.push(segment.endTime)
    } else {
      rowEndTimes[assignedRow] = segment.endTime
    }

    segment.rowIndex = assignedRow
  }

  return segments
})

const totalRows = computed(() => {
  if (clipSegments.value.length === 0) return 0
  return Math.max(...clipSegments.value.map(s => s.rowIndex)) + 1
})

const rowsByIndex = computed(() => {
  const rows: ClipSegment[][] = []
  for (let i = 0; i < totalRows.value; i++) {
    rows.push([])
  }
  for (const segment of clipSegments.value) {
    rows[segment.rowIndex].push(segment)
  }
  return rows
})

function formatTime(time: number): string {
  const seconds = Math.floor(time)
  const milliseconds = Math.floor((time - seconds) * 100)
  return `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`
}

function syncTimelineData() {
  timelineData.value = { ...timelineData.value }
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

function getTimeFromMouseEvent(event: MouseEvent): number {
  const wrapper = document.querySelector('.timeline-content-wrapper') as HTMLElement
  if (!wrapper) return currentTime.value

  const wrapperRect = wrapper.getBoundingClientRect()
  const timeInfo = document.querySelector('.timeInfo') as HTMLElement
  if (!timeInfo) return currentTime.value

  const scrollLeft = timeInfo.scrollLeft
  const x = event.clientX - wrapperRect.left + scrollLeft
  const time = (x / wrapperRect.width) * effectiveDuration.value
  return Math.max(0, Math.min(time, effectiveDuration.value))
}

function handleTimeInfoMouseDown(event: MouseEvent) {
  if (dragMoved) {
    dragMoved = false
    return
  }

  const target = event.target as HTMLElement
  if (target.closest('.keyframe-node') || target.closest('.track-timeline') || target.closest('.track-header') || target.closest('.track-item') || target.closest('.playhead-line')) {
    return
  }

  if (activeClipId.value) {
    closeClipContent()
    scrubClosedPanel = true
    return
  }

  isScrubbing = true
  scrubClosedPanel = false
  currentTime.value = getTimeFromMouseEvent(event)
  evaluateTimeline(currentTime.value)

  document.addEventListener('mousemove', onScrubDrag)
  document.addEventListener('mouseup', stopScrub)
}

function onScrubDrag(event: MouseEvent) {
  if (!isScrubbing) return
  currentTime.value = getTimeFromMouseEvent(event)
  evaluateTimeline(currentTime.value)
}

function stopScrub() {
  isScrubbing = false
  document.removeEventListener('mousemove', onScrubDrag)
  document.removeEventListener('mouseup', stopScrub)
}

function onScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollLeft.value = target.scrollLeft
}

function toggleClipContent(event: MouseEvent, segment: ClipSegment) {
  if (dragMoved) {
    dragMoved = false
    return
  }

  if (activeClipId.value === segment.clip.entityId) {
    closeClipContent()
    return
  }

  activeClipId.value = segment.clip.entityId
  activeSegment.value = segment

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()

  const panelWidth = Math.max(rect.width, 200)
  let left = rect.left
  if (left + panelWidth > window.innerWidth) {
    left = window.innerWidth - panelWidth - 10
  }
  if (left < 10) left = 10

  trackContentStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    top: `${rect.bottom + 4}px`,
    width: `${panelWidth}px`,
    zIndex: '1000'
  }
}

function closeClipContent() {
  activeClipId.value = null
  activeSegment.value = null
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

function getCurvePoints(track: TrackData, segment?: ClipSegment): string {
  if (track.keyframes.length < 2) return ''

  const startTime = segment ? segment.startTime : 0
  const endTime = segment ? segment.endTime : effectiveDuration.value
  const segDuration = endTime - startTime || 1

  const points = track.keyframes
    .sort((a, b) => a.time - b.time)
    .map(kf => {
      const x = ((kf.time - startTime) / segDuration) * 100
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

function handleTrackClick(event: MouseEvent, track: TrackData, segment?: ClipSegment) {
  if (dragMoved) {
    dragMoved = false
    return
  }

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const segDuration = segment ? (segment.endTime - segment.startTime) : effectiveDuration.value
  const startTime = segment ? segment.startTime : 0
  const time = startTime + (x / rect.width) * segDuration

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

  timelineData.value = { ...timelineData.value }
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

  if (currentTime.value >= effectiveDuration.value) {
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
  const time = (x / rect.width) * effectiveDuration.value

  currentTime.value = Math.max(0, Math.min(time, effectiveDuration.value))
  evaluateTimeline(currentTime.value)
}

function stopDragging() {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
}

function startClipDrag(e: MouseEvent, entityId: string) {
  e.stopPropagation()
  isDraggingClip = true
  dragClipId = entityId
  dragStartX = e.clientX
  dragMoved = false
  dragStartTimes.clear()

  console.log('[DEBUG] startClipDrag', { entityId, clientX: e.clientX })
  console.log('[DEBUG] animatedObjects keys:', [...animatedObjects.keys()])
  console.log('[DEBUG] timelineData clips:', timelineData.value.clips.map(c => c.entityId))

  if (activeClipId.value) {
    closeClipContent()
  }

  const clip = timelineData.value.clips.find(c => c.entityId === entityId)
  if (clip) {
    for (const track of clip.tracks) {
      const times = track.keyframes.map(kf => kf.time)
      dragStartTimes.set(track.trackType, times)
    }
    console.log('[DEBUG] clip found:', clip.entityId, 'tracks:', clip.tracks.length)
  } else {
    console.warn('[DEBUG] clip NOT found for entityId:', entityId)
  }

  document.addEventListener('mousemove', onClipDrag)
  document.addEventListener('mouseup', stopClipDrag)
}

function onClipDrag(e: MouseEvent) {
  if (!isDraggingClip || !dragClipId) return

  const wrapper = document.querySelector('.timeline-content-wrapper') as HTMLElement
  if (!wrapper) return

  const rect = wrapper.getBoundingClientRect()
  const widthPerSecond = rect.width / effectiveDuration.value
  const deltaX = e.clientX - dragStartX

  if (Math.abs(deltaX) > 2) {
    dragMoved = true
  }

  if (!dragMoved) return

  const deltaTime = deltaX / widthPerSecond
  console.log('[DEBUG] onClipDrag', { deltaX, deltaTime, dragClipId })

  const clip = timelineData.value.clips.find(c => c.entityId === dragClipId)
  if (!clip) {
    console.warn('[DEBUG] onClipDrag: clip not found for', dragClipId)
    return
  }

  for (const track of clip.tracks) {
    const originalTimes = dragStartTimes.get(track.trackType)
    if (!originalTimes) continue

    for (let i = 0; i < track.keyframes.length; i++) {
      if (originalTimes[i] !== undefined) {
        track.keyframes[i].time = Math.max(0, originalTimes[i] + deltaTime)
      }
    }
  }
  // 回退：使用原来的浅拷贝
  timelineData.value = { ...timelineData.value }
  console.log('[DEBUG] timelineData updated, first clip time:', timelineData.value.clips[0]?.tracks[0]?.keyframes[0]?.time)
}

function stopClipDrag() {
  console.log('[DEBUG] stopClipDrag, dragMoved:', dragMoved)
  isDraggingClip = false
  dragClipId = null
  dragStartTimes.clear()
  document.removeEventListener('mousemove', onClipDrag)
  document.removeEventListener('mouseup', stopClipDrag)
}

const animatedObjects = new Map<string, THREE.Mesh | THREE.Group>()

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

function applyTrackValue(obj: THREE.Object3D, trackType: TrackType, value: any) {
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
      if (obj instanceof THREE.Mesh) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        materials.forEach(m => {
          if (m instanceof THREE.Material) {
            (m as THREE.MeshStandardMaterial).opacity = value
            m.transparent = value < 1
          }
        })
      } else {
        obj.traverse(child => {
          if (child instanceof THREE.Mesh) {
            const materials = Array.isArray(child.material) ? child.material : [child.material]
            materials.forEach(m => {
              if (m instanceof THREE.Material) {
                (m as THREE.MeshStandardMaterial).opacity = value
                m.transparent = value < 1
              }
            })
          }
        })
      }
      break
  }
}

function clearAll() {
  const scene = (window as any).worldApi?.scene
  if (!scene) return

  animatedObjects.forEach(obj => {
    scene.remove(obj)
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      if (obj.material instanceof THREE.Material) {
        obj.material.dispose()
      }
    } else {
      obj.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
    }
  })
  animatedObjects.clear()
  timelineData.value = { ...timelineData.value, clips: [] }
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
    timelineData.value = { ...timelineData.value }
  }
})

function registerAnimatedObject(id: string, mesh: THREE.Mesh | THREE.Group) {
  animatedObjects.set(id, mesh as THREE.Mesh)
}

function unregisterAnimatedObject(id: string) {
  animatedObjects.delete(id)
}

defineExpose({ registerAnimatedObject, unregisterAnimatedObject })

function scrollTimeInfo(e: Event) {
  // @ts-ignore
  timelineRuler.value.scrollLeft = e.target.scrollLeft
}

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

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    // background: #16213e;
    border-bottom: 1px solid #0f3460;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

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
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;

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
    }
  }

  .timeline-scroll-container {
    flex: 1;
    overflow-x: auto;
    overflow-y: auto;
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: start;
    padding: 0 4px 4px 4px;

    .timeInfo {
      flex-grow: 1;
      flex-shrink: 1;
      overflow-x: auto;
      overflow-y: auto;
      height: 100%;
      display: grid;
      grid-template-areas: "layer";

      .timeline-content-wrapper {
        grid-area: layer;
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .playhead-container {
        grid-area: layer;
        position: relative;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 100;

        .playhead-line {
          position: absolute;
          top: 0;
          width: 2px;
          height: 100%;
          background: rgba(233, 69, 96, 0.6);
          cursor: ew-resize;
          box-shadow: 0 0 6px rgba(233, 69, 96, 0.3);
        }
      }

      .timeline-content-wrapper {
        .timeline-track-area {
          overflow-y: auto;
          box-sizing: border-box;
          position: relative;

          .track-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .timeline-row {
            position: relative;
            height: 35px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);

            .track-item {
              position: absolute;
              border-radius: 6px;
              overflow: visible;
              border: 1px solid #1a4d7a;
              box-sizing: border-box;
              min-width: 20px;
              z-index: 5;
              height: 35px;
              top: 0;
              cursor: move;
              background: rgba(15, 52, 96, 0.4);
              transition: box-shadow 0.15s;

              &:hover {
                box-shadow: 0 0 0 1px rgba(233, 69, 96, 0.5);
              }

              &.active {
                box-shadow: 0 0 0 1px #e94560;
                z-index: 50;
              }

              &:active {
                cursor: grabbing;
              }

              .track-header-bar {
                display: flex;
                align-items: center;
                height: 35px;
                padding: 0 8px;
                gap: 8px;
                color: white;
                font-size: 12px;
                overflow: hidden;

                .clip-name {
                  font-weight: 500;
                  color: #e94560;
                  flex-shrink: 0;
                  max-width: 80px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .clip-duration {
                  color: #a8b2d1;
                  font-size: 10px;
                }
              }
            }
          }
        }
      }
    }
  }

  .timeline-ruler {
    height: 24px;
    // background: #0f3460;
    box-sizing: border-box;
    position: relative;
    overflow-x: hidden;
    margin-left: 4px;
    // background-color: red;

    &::-webkit-scrollbar {
      // background-color: red;
      display: none;
    }

    .ruler-track {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .ruler-marks {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

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
    }
  }

  .keyframe-panel {
    padding: 12px;
    background: #16213e;
    border-top: 1px solid #0f3460;

    .panel-header {
      font-size: 13px;
      font-weight: 500;
      color: #e94560;
      margin-bottom: 8px;
    }

    .panel-content {
      display: flex;
      gap: 16px;

      .property-row {
        display: flex;
        flex-direction: column;
        gap: 4px;

        label {
          font-size: 12px;
          color: #6b7280;
        }

        input,
        select {
          padding: 4px 8px;
          border: 1px solid #0f3460;
          border-radius: 4px;
          background: #0f3460;
          color: #fff;
          font-size: 12px;
        }
      }
    }
  }

  .demo-controls {
    display: flex;
    gap: 8px;
    padding: 12px;
    background: #16213e;
    border-top: 1px solid #0f3460;

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
  }

  // ::-webkit-scrollbar {
  //   width: 6px;
  //   height: 6px;
  // }

  // ::-webkit-scrollbar-track {
  //   background: #879cd4;
  // }

  // ::-webkit-scrollbar-thumb {
  //   background: #0f3460;
  //   border-radius: 3px;

  //   &:hover {
  //     background: #1a4d7a;
  //   }
  // }
}

.track-content-floating {
  background: rgba(15, 52, 96, 0.98);
  border: 1px solid #e94560;
  border-radius: 6px;
  padding: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  box-sizing: border-box;

  .floating-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    margin-bottom: 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .floating-title {
      font-weight: 500;
      color: #e94560;
      font-size: 13px;
      flex: 1;
    }

    .floating-time {
      color: #a8b2d1;
      font-size: 11px;
    }

    .floating-close {
      background: none;
      border: none;
      color: #a8b2d1;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
      line-height: 1;

      &:hover {
        color: #fff;
      }
    }
  }

  .track-row {
    display: flex;
    align-items: center;
    height: 35px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    box-sizing: border-box;
    white-space: nowrap;
    gap: 8px;

    &:last-child {
      border-bottom: none;
    }

    .track-label {
      width: 60px;
      font-size: 11px;
      color: #a8b2d1;
      flex-shrink: 0;
    }

    .track-timeline {
      flex: 1;
      position: relative;
      height: 100%;
      cursor: crosshair;

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
    }
  }
}
</style>
