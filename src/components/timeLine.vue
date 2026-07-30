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
              <div v-for="segment in row" :key="segment.clip.clipId" class="track-item"
                :class="{ active: activeClipId === segment.clip.clipId, warning: overlappingClipIds.has(segment.clip.clipId) }"
                :style="{
                  left: `${(segment.startTime / effectiveDuration) * 100}%`,
                  width: `${((segment.endTime - segment.startTime) / effectiveDuration) * 100}%`
                }" @mousedown="startClipDrag($event, segment.clip.clipId)"
                @click.stop="toggleClipContent($event, segment)">
                <div class="track-header-bar">
                  <span class="clip-name">{{ segment.clip.entityId }}</span>
                  <span class="clip-duration">{{ formatTime(segment.startTime) }} - {{ formatTime(segment.endTime)
                    }}</span>
                </div>
                <div v-if="overlappingClipIds.has(segment.clip.clipId)" class="warning-badge" title="同一个物体对象不允许时间重叠">
                  <span class="warning-icon">⚠</span>
                  <span class="warning-text">同一个物体对象不允许时间重叠</span>
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
    <DataTypeEditPanel v-if="editPropConfigInfo.length && contextMenu" :typeKey="editPropTypeKey || ''"
      :editPropConfigInfo="editPropConfigInfo" v-model="editPropInputInfo"
      :initPosition="{ x: contextMenu.x, y: contextMenu.y }" @close="editPropConfigInfo = []" />

    <teleport to="#teleport" v-if="activeSegment">
      <div class="track-content-floating" :style="trackContentStyle" @click.stop>
        <div class="floating-header">
          <span class="floating-title">{{ activeSegment.clip.entityId }}</span>
          <span class="floating-time">{{ formatTime(activeSegment.startTime) }} - {{ formatTime(activeSegment.endTime)
            }}</span>
          <button class="floating-delete" @click="deleteClip(activeSegment.clip.clipId)" title="删除动画">🗑</button>
          <button class="floating-close" @click="closeClipContent">×</button>
        </div>
        <div v-for="track in activeSegment.clip.tracks" :key="track.trackType" class="track-row">
          <div class="track-label">
            <span>{{ track.trackType }}</span>
            <button class="track-remove" @click="removeTrack(track.trackType)" title="移除轨道">✕</button>
          </div>
          <div class="track-timeline" @click="handleTrackClick($event, track, activeSegment)">
            <div class="track-background">
              <svg class="curve-line" viewBox="0 0 100 20" preserveAspectRatio="none">
                <polyline :points="getCurvePoints(track, activeSegment)" fill="none" stroke="#4CAF50"
                  stroke-width="1" />
              </svg>
              <div v-for="keyframe in track.keyframes" :key="keyframe.time" class="keyframe-node"
                :style="{ left: `${((keyframe.time - activeSegment.startTime) / (activeSegment.endTime - activeSegment.startTime || 1)) * 100}%` }"
                :class="{ selected: isKeyframeSelected(activeSegment.clip.clipId, track.trackType, keyframe) }"
                @click.stop="onKeyframeClick($event, activeSegment.clip.clipId, activeSegment.clip.entityId, track.trackType, keyframe)">
              </div>
            </div>
          </div>
        </div>
        <div class="add-track-area">
          <div v-if="!isShowTrackDropdown" class="add-track-select" @click="showTrackDropdown">
            <span>＋ 添加属性</span>
          </div>
          <div v-else class="track-dropdown">
            <div class="track-dropdown-header">选择属性</div>
            <div v-for="type in availableTrackTypes" :key="type" class="track-dropdown-item" @click="addTrack(type)">
              {{ translateTrackType(type) }}
            </div>
            -----
            <div v-for="item in availableTrackTypes2" :key="item.id" class="track-dropdown-item"
              @click="addTrack(item.id)">
              {{ item.label }}
            </div>
            <div class="track-dropdown-close" @click="isShowTrackDropdown = false">取消</div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { message } from '@/utils/message'
import { ClipSegment, TimelineData, TrackData, Keyframe } from '@/utils/timelineState';
import editItem from '@/utils/editItem';
import DataTypeEditPanel from '../views/DataTypeEditPanel.vue'

const props = defineProps<{
  modelValue: TimelineData
  getObject?: (entityId: string) => THREE.Object3D | null
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
const zoomLevel = ref(1)
const scrollLeft = ref(0)
const collapsedClips = ref<Set<string>>(new Set())
const activeClipId = ref<string | null>(null)
const activeSegment = ref<ClipSegment | null>(null)
const trackContentStyle = ref<Record<string, string>>({})
const isShowTrackDropdown = ref(false)
const selectedKeyframe = ref<{ clipId: string; entityId: string; trackType: string; keyframe: Keyframe } | null>(null)

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

  for (let index = 0; index < timelineData.value.clips.length; index++) {
    const clip = timelineData.value.clips[index]
    const allTimes: number[] = []
    for (const track of clip.tracks) {
      for (const kf of track.keyframes) {
        allTimes.push(kf.time)
      }
    }

    let startTime: number
    let endTime: number

    if (allTimes.length === 0) {
      startTime = index * 3
      endTime = startTime + 10
    } else {
      startTime = Math.min(...allTimes)
      endTime = Math.max(...allTimes)
    }

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

// 检测同一对象的多个 clip 是否存在时间重叠
const overlappingClipIds = computed(() => {
  const overlappingIds = new Set<string>()
  const clipsByEntity = new Map<string, ClipSegment[]>()

  for (const segment of clipSegments.value) {
    const entityId = segment.clip.entityId
    if (!clipsByEntity.has(entityId)) {
      clipsByEntity.set(entityId, [])
    }
    clipsByEntity.get(entityId)!.push(segment)
  }

  for (const [, segments] of clipsByEntity) {
    if (segments.length <= 1) continue

    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const a = segments[i]
        const b = segments[j]
        if (a.startTime < b.endTime && b.startTime < a.endTime) {
          overlappingIds.add(a.clip.clipId)
          overlappingIds.add(b.clip.clipId)
        }
      }
    }
  }

  return overlappingIds
})

function formatTime(time: number): string {
  const seconds = Math.floor(time)
  const milliseconds = Math.floor((time - seconds) * 100)
  return `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`
}

function translateTrackType(type: string): string {
  const translations: Record<string, string> = {
    position: '位置',
    rotation: '旋转',
    scale: '缩放',
    visible: '可见',
    opacity: '透明度'
  }
  return translations[type] || type
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

  if (activeClipId.value === segment.clip.clipId) {
    closeClipContent()
    return
  }

  if (isPlaying.value) {
    togglePlay()
  }

  activeClipId.value = segment.clip.clipId
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
    left: `${left}px`,
    top: `${rect.bottom + 4}px`,
    width: `${panelWidth}px`
  }
}

function closeClipContent() {
  activeClipId.value = null
  activeSegment.value = null
  isShowTrackDropdown.value = false
}

function deleteClip(clipId: string) {
  const newClips = timelineData.value.clips.filter(c => c.clipId !== clipId)
  timelineData.value = { ...timelineData.value, clips: newClips }
  closeClipContent()
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

function isKeyframeSelected(clipId: string, trackType: string, keyframe: Keyframe): boolean {
  return selectedKeyframe.value?.clipId === clipId &&
    selectedKeyframe.value?.trackType === trackType &&
    selectedKeyframe.value?.keyframe === keyframe
}

const editPropConfigInfo = ref<editItem[]>([])
const editPropInputInfo = ref<any>({})
const editPropTypeKey = ref<string>()
const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
} | null>(null)
let editPropConfigEditCallback = (val: any) => {
  console.log(val)
}

function onKeyframeClick(event: MouseEvent, clipId: string, entityId: string, trackType: string, keyframe: Keyframe) {
  if (isPlaying.value) {
    togglePlay()
  }
  // console.log('keyframe', clipId, entityId, trackType, keyframe)
  const entity = window.worldApi.children.find(v => v.getData().id === entityId)
  if (!entity) return;

  editPropConfigEditCallback = (val: any) => {
    console.log('vvvvv', keyframe.value, val, trackType, val[trackType])
    keyframe.value = val[trackType]
  }

  function callback(config: editItem[]) {
    const match = config.find(v => v.id === trackType)
    console.log('match', match)
    if (!match) return
    editPropConfigInfo.value = [match]
    editPropTypeKey.value = entity!.type;
    const inputData: any = {
      [trackType]: keyframe.value
    }
    // editPropConfigInfo.value.forEach(v => {
    //   if (v.dataType !== 'title') {
    //     inputData[v.id] = v.value
    //   }
    // })
    editPropInputInfo.value = inputData;

    const contextMenuX = event.clientX
    const contextMenuY = event.clientY
    contextMenu.value = {
      visible: true,
      x: contextMenuX,
      y: contextMenuY,
    }
  }
  const config = entity.getEditPropConfigData(entity.getData())
  if (config instanceof Promise) {
    config.then(callback)
  } else {
    callback(config)
  }
  selectedKeyframe.value = { clipId, entityId, trackType, keyframe }
}

watch(() => editPropInputInfo.value, () => {
  if (contextMenu.value?.visible) {
    editPropConfigEditCallback(editPropInputInfo.value)
  }
}, {
  deep: true
})

function handleTrackClick(event: MouseEvent, track: TrackData, segment?: ClipSegment) {
  if (dragMoved) {
    dragMoved = false
    return
  }

  if (isPlaying.value) {
    togglePlay()
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
}

function togglePlay() {
  if (!isPlaying.value && overlappingClipIds.value.size > 0) {
    message.warning('同一个物体对象不允许时间重叠，请先解决时间重叠问题')
    return
  }

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

function startClipDrag(e: MouseEvent, clipId: string) {
  e.stopPropagation()
  if (isPlaying.value) {
    togglePlay()
  }
  isDraggingClip = true
  dragClipId = clipId
  dragStartX = e.clientX
  dragMoved = false
  dragStartTimes.clear()

  if (activeClipId.value) {
    closeClipContent()
  }

  const clip = timelineData.value.clips.find(c => c.clipId === clipId)
  if (clip) {
    for (const track of clip.tracks) {
      const times = track.keyframes.map(kf => kf.time)
      dragStartTimes.set(track.trackType, times)
    }
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

  const clip = timelineData.value.clips.find(c => c.clipId === dragClipId)
  if (!clip) return

  for (const track of clip.tracks) {
    const originalTimes = dragStartTimes.get(track.trackType)
    if (!originalTimes) continue

    for (let i = 0; i < track.keyframes.length; i++) {
      if (originalTimes[i] !== undefined) {
        track.keyframes[i].time = Math.max(0, originalTimes[i] + deltaTime)
      }
    }
  }
  timelineData.value = { ...timelineData.value }
}

function stopClipDrag() {
  isDraggingClip = false
  dragClipId = null
  dragStartTimes.clear()
  document.removeEventListener('mousemove', onClipDrag)
  document.removeEventListener('mouseup', stopClipDrag)
}

function evaluateTimeline(time: number) {
  timelineData.value.clips.forEach(clip => {
    const obj = props.getObject?.(clip.entityId)
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

  // 当时间在关键帧范围外时，返回 null 表示该 clip 不应在此时间段内生效
  if (time < sortedKeyframes[0].time) return null
  if (time > sortedKeyframes[sortedKeyframes.length - 1].time) return null

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

function interpolateValues(a: any, b: any, t: number, trackType: string): any {
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

function applyTrackValue(obj: THREE.Object3D, trackType: string, value: any) {
  if (value === null || value === undefined) return

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

const allTrackTypes: string[] = ['position', 'rotation', 'scale', 'visible', 'opacity']

const availableTrackTypes = computed(() => {
  if (!activeSegment.value) return allTrackTypes
  const existingTypes = new Set(activeSegment.value.clip.tracks.map(t => t.trackType))
  return allTrackTypes.filter(t => !existingTypes.has(t))
})
const availableTrackTypes2 = ref<{
  id: string,
  label: string,
}[]>([])

function addTrack(trackType: string) {
  if (!activeSegment.value) return
  const newTrack: TrackData = {
    trackType,
    keyframes: [],
    interpolation: 'linear'
  }
  activeSegment.value.clip.tracks.push(newTrack)
  timelineData.value = { ...timelineData.value }
  isShowTrackDropdown.value = false
}

function removeTrack(trackType: string) {
  if (!activeSegment.value) return
  const clip = activeSegment.value.clip
  clip.tracks = clip.tracks.filter(t => t.trackType !== trackType)
  timelineData.value = { ...timelineData.value }
}

function showTrackDropdown() {
  if (!activeSegment.value) return;
  const { entityId } = activeSegment.value.clip
  const entity = window.worldApi.children.find(v => v.getData().id === entityId)
  if (!entity) return;
  console.log('entity.editPropConfig', entity.editPropConfig)
  function callback(config: editItem[]) {
    availableTrackTypes2.value.push(...config.map(v => {
      return {
        id: v.id,
        label: v.label
      }
    }))
    isShowTrackDropdown.value = true
  }
  const config = entity.getEditPropConfigData(entity.getData())
  if (config instanceof Promise) {
    config.then(callback)
  } else {
    callback(config)
  }
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
          padding-top: 8px;
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

              &.warning {
                border-color: #ff9800;
                background: rgba(255, 152, 0, 0.2);
                animation: warning-pulse 1.5s ease-in-out infinite;

                &:hover {
                  box-shadow: 0 0 0 1px #ff9800;
                }
              }

              .warning-badge {
                position: absolute;
                top: -8px;
                right: -6px;
                padding: 2px 6px;
                background: #ff9800;
                color: white;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 3px;
                font-size: 10px;
                font-weight: bold;
                line-height: 1;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

                .warning-icon {
                  font-size: 10px;
                  line-height: 1;
                }

                .warning-text {
                  font-size: 10px;
                  line-height: 1;
                }
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
  position: fixed;
  z-index: 999;
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

    .floating-delete {
      background: none;
      border: none;
      color: #a8b2d1;
      cursor: pointer;
      font-size: 14px;
      padding: 0 4px;
      line-height: 1;

      &:hover {
        color: #f56c6c;
      }
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
      width: 70px;
      font-size: 11px;
      color: #a8b2d1;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .track-remove {
        background: none;
        border: none;
        color: #a8b2d1;
        cursor: pointer;
        font-size: 10px;
        padding: 0;
        line-height: 1;
        opacity: 0;
        transition: opacity 0.15s, color 0.15s;

        &:hover {
          color: #f56c6c;
        }
      }

      &:hover .track-remove {
        opacity: 1;
      }
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
          transform: scale(1.4);
          box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.4);
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

  .add-track-area {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;

    .add-track-select {
      width: 100%;
      padding: 6px 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: #a8b2d1;
      font-size: 12px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.4);
        color: #fff;
      }

      option {
        background: #1a1a2e;
        color: #a8b2d1;
      }
    }

    .track-dropdown {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 6px 0;
      margin-bottom: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      z-index: 100;

      .track-dropdown-header {
        padding: 4px 10px 6px;
        font-size: 11px;
        color: #a8b2d1;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        margin-bottom: 4px;
      }

      .track-dropdown-item {
        padding: 6px 10px;
        font-size: 12px;
        color: #d0d0d0;
        cursor: pointer;
        transition: background 0.15s;

        &:hover {
          background: rgba(233, 69, 96, 0.2);
          color: #e94560;
        }
      }

      .track-dropdown-close {
        padding: 6px 10px 2px;
        font-size: 11px;
        color: #666;
        cursor: pointer;
        text-align: center;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        margin-top: 4px;

        &:hover {
          color: #a8b2d1;
        }
      }
    }
  }
}

@keyframes warning-pulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.4);
  }

  50% {
    box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
  }
}
</style>
