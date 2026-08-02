<template>
  <!-- 时间轴根容器：包含头部控制栏 + 标尺 + 轨道区域 + 浮动编辑面板（teleport） -->
  <div class="timeline-container">
    <!-- 头部控制栏：左侧标题+时间显示，右侧控制按钮（停止/播放/倍速/缩放） -->
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

    <!-- 时间标尺：显示主/次刻度，宽度随缩放级别变化，与内容宽度保持一致 -->
    <div class="timeline-ruler" ref="timelineRuler" @scroll.prevent.stop>
      <div class="ruler-track" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
        <div class="ruler-marks">
          <!-- ruler-mark.major：整数秒刻度，带时间标签；minor：次级刻度无标签 -->
          <div v-for="mark in rulerMarks" :key="mark.time" class="ruler-mark" :class="{ major: mark.major }"
            :style="{ left: `${(mark.time / effectiveDuration) * 100}%` }">
            <span v-if="mark.major" class="mark-label">{{ formatTime(mark.time) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 滚动容器：控制轨道区域横向与纵向滚动，onScroll 同步 scrollLeft 状态 -->
    <div class="timeline-scroll-container" @scroll="onScroll">
      <!-- timeInfo：使用 CSS Grid 叠加两层（timeline-content-wrapper + playhead-container），使播放头贯穿整个区域 -->
      <div class="timeInfo" @mousedown="handleTimeInfoMouseDown">
        <!-- 轨道内容层：承载所有 timeline-row + track-item，宽度随 zoomLevel 放大 -->
        <div class="timeline-content-wrapper" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
          <div class="timeline-track-area">
            <!-- timeline-row：一行可以放多个互不时间冲突的 track-item（由区间图着色算法分配行号） -->
            <div v-for="(row, rowIndex) in rowsByIndex" :key="`time-row-${rowIndex}`" class="timeline-row">
              <!-- track-item：单个动画片段（Clip），绝对定位由 startTime + duration 决定
                   warning class：同一 entityId 的多个 clip 时间重叠时高亮
                   @mousedown：开始拖拽 clip（整体平移，含 clip 边界和内部 keyframes 时间）
                   @click.stop：切换浮动编辑面板显示/隐藏 -->
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
                <!-- 时间重叠警告徽章：hover 时显示 title 文案，点击播放时会被拦截 -->
                <div v-if="overlappingClipIds.has(segment.clip.clipId)" class="warning-badge" title="同一个物体对象不允许时间重叠">
                  <span class="warning-icon">⚠</span>
                  <span class="warning-text">同一个物体对象不允许时间重叠</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 播放头容器层：与 timeline-content-wrapper 同区域但 z-index 更高（pointer-events:none），
             仅 playhead-line 自身响应 mousedown 进行拖拽定位 -->
        <div class="playhead-container" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
          <div class="playhead-line" :style="{ left: `${(currentTime / effectiveDuration) * 100}%` }"
            @mousedown="startDragging"></div>
        </div>
      </div>
    </div>

    <!-- 关键帧属性编辑面板：由 onKeyframeClick 打开，读取 entity 的编辑配置动态渲染 -->
    <DataTypeEditPanel v-if="editPropConfigInfo.length && contextMenu" :typeKey="editPropTypeKey || ''"
      :editPropConfigInfo="editPropConfigInfo" v-model="editPropInputInfo"
      :initPosition="{ x: contextMenu.x, y: contextMenu.y }" @close="editPropConfigInfo = []" />

    <!-- 浮动轨道编辑面板：通过 <teleport to="#teleport"> 渲染在全局，
         样式位置由 trackContentStyle 计算，避免被父容器 overflow 裁剪 -->
    <teleport to="#teleport" v-if="activeSegment">
      <div class="track-content-floating" :style="trackContentStyle" @click.stop>
        <!-- 面板头部：标题 + 时间范围 + 删除动画按钮 + 关闭按钮 -->
        <div class="floating-header">
          <span class="floating-title">{{ activeSegment.clip.entityId }}</span>
          <span class="floating-time">{{ formatTime(activeSegment.startTime) }} - {{ formatTime(activeSegment.endTime)
          }}</span>
          <button class="floating-delete" @click="deleteClip(activeSegment.clip.clipId)" title="删除动画">🗑</button>
          <button class="floating-close" @click="closeClipContent">×</button>
        </div>

        <!-- 每个轨道一行：左侧 track-label（含移除按钮），右侧 track-timeline（点击添加/拖拽关键帧 + 曲线预览） -->
        <div v-for="track in activeSegment.clip.tracks" :key="track.trackType" class="track-row">
          <div class="track-label">
            <span>{{ track.trackType }}</span>
            <button class="track-remove" @click="removeTrack(track.trackType)" title="移除轨道">✕</button>
          </div>
          <div class="track-timeline" @click="handleTrackClick($event, track, activeSegment)">
            <div class="track-background">
              <!-- SVG polyline：绘制关键帧之间的数值曲线（opacity/visible 会做 Y 轴映射，其他默认水平线） -->
              <svg class="curve-line" viewBox="0 0 100 20" preserveAspectRatio="none">
                <polyline :points="getCurvePoints(track, activeSegment)" fill="none" stroke="#4CAF50"
                  stroke-width="1" />
              </svg>
              <!-- keyframe-node：可拖拽调整时间，点击选中态（红色高亮），点击打开 DataTypeEditPanel -->
              <div v-for="keyframe in track.keyframes" :key="keyframe.time" class="keyframe-node"
                :style="{ left: `${((keyframe.time - activeSegment.startTime) / (activeSegment.endTime - activeSegment.startTime || 1)) * 100}%` }"
                :class="{ selected: isKeyframeSelected(activeSegment.clip.clipId, track.trackType, keyframe) }"
                @mousedown.stop="startKeyframeDrag($event, activeSegment.clip.clipId, track.trackType, keyframe)"
                @click.stop="onKeyframeClick($event, activeSegment.clip.clipId, activeSegment.clip.entityId, track.trackType, keyframe)">
              </div>
            </div>
          </div>
        </div>

        <!-- 添加属性区域：默认显示「＋ 添加属性」按钮；点击后展开 dropdown 选择轨道类型 -->
        <div class="add-track-area">
          <div v-if="!isShowTrackDropdown" class="add-track-select" @click="showTrackDropdown">
            <span>＋ 添加属性</span>
          </div>
          <div v-else class="track-dropdown">
            <div class="track-dropdown-header">选择属性</div>
            <!-- 动态读取 entity 的编辑配置，仅展示当前 clip 还未添加的轨道类型 -->
            <div v-for="item in availableTrackTypes" :key="item.id" class="track-dropdown-item"
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
// onMounted 已预留（未来可能需要挂载后初始化标尺同步滚动等），暂未使用
import { ref, computed, onUnmounted, watch, onMounted } from 'vue'
import { message } from '@/utils/message'
// timelineState 模块：管理时间轴状态，clip/track/keyframe 数据结构，以及全局播放状态标志
import { ClipSegment, TimelineData, TrackData, Keyframe, timelineState, ClipData } from '@/utils/timelineManage';
import editItem from '@/utils/editItem';
import DataTypeEditPanel from '../views/DataTypeEditPanel.vue'

// ========== Props & 事件 ==========
// - modelValue：由父组件（Application.vue）通过 v-model 控制的时间轴动画数据
// - getObject：根据 entityId 获取 THREE.Object3D（Mesh/Group），用于场景对象的 opacity/visible 等属性应用
// const props = defineProps<{
//   modelValue: TimelineData
// }>()

// const emit = defineEmits<{
//   (e: 'update:modelValue', value: TimelineData): void
// }>()

// timelineData 计算属性：作为 v-model 的包装，读 props.modelValue，写时 emit 向上通知父组件更新
// const timelineData___ = computed({
//   get: () => props.modelValue,
//   set: (value) => emit('update:modelValue', value)
// })
const effectiveDuration = ref<number>(0)
const rulerMarks = ref<{
  time: number;
  major: boolean;
}[]>([])
const clipSegments = ref<ClipSegment[]>([])
onMounted(() => {
  function updateRef() {
    effectiveDuration.value = (() => {
      console.log('1111-1', timelineState.timelineData.clips)
      if (timelineState.timelineData.clips) {
        let maxTime = timelineState.timelineData.duration
        for (const clip of timelineState.timelineData.clips) {
          if (clip.endTime > maxTime) maxTime = clip.endTime
        }
        return Math.max(maxTime + 5, 30);
      } else {
        return 0;
      }
    })();
    // rulerMarks：标尺刻度（平均切成 20 份；整数秒为主刻度（major带标签），其余为次刻度
    rulerMarks.value = (() => {
      const marks: any[] = []
      const dur = effectiveDuration.value
      const step = dur / 20
      console.log('ddddddd', marks, dur, step);
      if (dur > 0) {
        for (let i = 0; i <= dur; i += step) {
          marks.push({
            time: i,
            major: i % 1 === 0
          })
        }
      }
      return marks
    })()

    // clipSegments：将 clips 包装成渲染用的 ClipSegment 列表
    //  核心逻辑：区间图着色（Interval Graph Coloring）贪心算法，按 startTime 排序，
    // 每个 segment 分配到最早可用的 row（rowEndTimes[r] <= segment.startTime 时占用该行），
    // 时间冲突时新增一行，实现多 clip 时间不冲突的共用一行，减少垂直占用
    clipSegments.value = (() => {
      const segments: ClipSegment[] = []

      if (timelineState.timelineData.clips) {
        for (const clip of timelineState.timelineData.clips) {
          segments.push({
            clip,
            startTime: clip.startTime,
            endTime: clip.endTime,
            rowIndex: 0
          })
        }
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
    })();
  }
  updateRef()
  timelineState.onChange(() => {
    console.log(1111)
    updateRef()
  })
  currentTime.value = timelineState.currentTime
  timelineState.onChangeCurrentTime(() => {
    currentTime.value = timelineState.currentTime
  })
})

// effectiveDuration（计算实际显示总时长
// = max(timelineData.duration, 所有clip.endTime) + 5秒尾部留白；最小 30秒
// const effectiveDuration = computed(() => {
//   let maxTime = timelineState.timelineData.duration
//   for (const clip of timelineState.timelineData.clips) {
//     if (clip.endTime > maxTime) maxTime = clip.endTime
//   }
//   return Math.max(maxTime + 5, 30)
// })

// ========== 响应式状态（播放控制） ==========
// timelineRuler：标尺 DOM 引用（预留，未来用于标尺与轨道 scrollLeft 同步；TS 提示未使用不影响功能）
// 变量由模板中的 ref="timelineRuler" 绑定实际注入
const timelineRuler = ref();
const currentTime = ref(0)                     // 当前播放时间（秒，可小数）
const isPlaying = ref(false)                  // 是否正在播放
const playbackSpeed = ref(1)                // 播放倍速（0.1x ~ 3x）
const zoomLevel = ref(1)                       // 时间轴横向缩放级别（0.2x ~ 5x）
const scrollLeft = ref(0)                     // 当前横向滚动位置
const collapsedClips = ref<Set<string>>(new Set()) // 折叠的对象轨道集合（预留）
const activeClipId = ref<string | null>(null) // 当前展开浮动面板的 clipId
const activeSegment = ref<ClipSegment | null>(null) // 当前展开浮动面板的 segment（含 startTime/endTime/rowIndex）
const trackContentStyle = ref<Record<string, string>>({}) // 浮动面板位置样式（left/top/width）
const isShowTrackDropdown = ref(false)        // 「添加属性」下拉菜单是否展开
// selectedKeyframe：当前被选中的关键帧（用于高亮红色），打开 DataTypeEditPanel 时赋值
const selectedKeyframe = ref<{ clipId: string; entityId: string; trackType: string; keyframe: Keyframe } | null>(null)

// ========== 非响应式临时状态（拖拽等） ==========
let animationFrameId: number | null = null   // requestAnimationFrame id，用于播放循环
let lastTimestamp = 0                        // 上一帧时间戳，计算 deltaTime
let isDragging = false                       // playhead-line（红色竖线）拖拽中标志
let isDraggingClip = false                   // track-item（整个clip）拖拽中标志
let dragClipId: string | null = null          // 被拖拽 clip 的 clipId
let dragStartX = 0                          // 拖拽起始 clientX
let dragMoved = false                        // 本次 mousedown+移动 超过阈值是否真正触发了拖拽（区分 click/drag）
// dragStartClipRange：clip 拖拽时记录的起始时间范围，用于保持时长并整体平移
let dragStartClipRange: { startTime: number; endTime: number } | null = null
// dragStartTimes：clip 拖拽时每个轨道的 keyframes 原始时间数组，避免累积偏移误差
const dragStartTimes = new Map<string, number[]>()
let isScrubbing = false                       // 空白区域按下拖动（scrub）播放头标志
let scrubClosedPanel = false                  // scrub 时是否关闭了浮动面板（用于 click 后续逻辑）
let isDraggingKeyframe = false               // 单个关键帧拖拽中标志
let dragKeyframeStartX = 0                  // 关键帧拖拽起始 clientX
// dragKeyframeInfo：关键帧拖拽上下文快照（clip边界+原始时间+容器DOM）
let dragKeyframeInfo: {
  clipId: string
  trackType: string
  keyframe: Keyframe
  startTime: number       // clip 的边界（关键帧不可越界）
  endTime: number
  originalTime: number      // 拖拽开始时的原始 keyframe.time
  container: HTMLElement | null
} | null = null

// totalRows：实际使用的总行数（= 最大 rowIndex + 1）
const totalRows = computed(() => {
  if (clipSegments.value.length === 0) return 0
  return Math.max(...clipSegments.value.map(s => s.rowIndex)) + 1
})

// rowsByIndex：按行号聚合 segment 段二维数组，供 v-for 渲染 timeline-row
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

// overlappingClipIds：检测相同 entityId 的多个 clip 时间重叠
// 判定公式：a.startTime < b.endTime && b.startTime < a.endTime
// 存在重叠时，播放被 togglePlay 拦截并弹出 message.warning
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

// formatTime：秒 → "08:30"（秒:厘秒），保留两位小数用于紧凑显示
function formatTime(time: number): string {
  const seconds = Math.floor(time)
  const milliseconds = Math.floor((time - seconds) * 100)
  return `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`
}

// zoomIn / zoomOut：时间轴缩放（0.2x ~ 5x），每次变化 0.2
function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.2, 5)
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.2, 0.2)
}

// getTimeFromMouseEvent：将鼠标事件坐标换算为时间（考虑横向滚动偏移），用于空白区域 scrub
function getTimeFromMouseEvent(event: MouseEvent): number {
  const wrapper = document.querySelector('.timeline-content-wrapper') as HTMLElement
  if (!wrapper) return timelineState.currentTime

  const wrapperRect = wrapper.getBoundingClientRect()
  const timeInfo = document.querySelector('.timeInfo') as HTMLElement
  if (!timeInfo) return timelineState.currentTime

  const scrollLeft = timeInfo.scrollLeft
  const x = event.clientX - wrapperRect.left + scrollLeft
  const time = (x / wrapperRect.width) * effectiveDuration.value
  return Math.max(0, Math.min(time, effectiveDuration.value))
}

// handleTimeInfoMouseDown：timeInfo 区域 mousedown 统一分发
// 1) 点击在 track-item / track-timeline / keyframe-node / playhead-line 上 → 忽略，让具体元素自行处理
// 2) 当前有浮动面板打开 → 先关闭面板（点击空白收起）
// 3) 其余空白 → 进入 scrub 模式（按下+移动=实时拖动播放头，按下+立即松开=跳转时间）
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
  timelineState.currentTime = getTimeFromMouseEvent(event)
  evaluateTimeline(timelineState.currentTime)

  document.addEventListener('mousemove', onScrubDrag)
  document.addEventListener('mouseup', stopScrub)
}

// onScrubDrag：scrub 模式下鼠标移动实时更新播放时间
function onScrubDrag(event: MouseEvent) {
  if (!isScrubbing) return
  timelineState.currentTime = getTimeFromMouseEvent(event)
  evaluateTimeline(timelineState.currentTime)
}

function stopScrub() {
  isScrubbing = false
  document.removeEventListener('mousemove', onScrubDrag)
  document.removeEventListener('mouseup', stopScrub)
}

// onScroll：timeline-scroll-container 滚动事件 → 同步 scrollLeft 状态（预留，用于未来缩放时定位对齐）
function onScroll(event: Event) {
  const target = event.target as HTMLElement
  scrollLeft.value = target.scrollLeft
}

// toggleClipContent：track-item 点击时，切换浮动面板显示/隐藏
// 点击同一个 clip 的 track-item → 关闭；点击不同 clip → 先关闭再打开
// 打开面板时：暂停播放（正在播放时），并根据 track-item DOM 位置计算面板 left/top/width
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
  // 边界校正：避免面板超出屏幕左右
  if (left + panelWidth > window.innerWidth) {
    left = window.innerWidth - panelWidth - 10
  }
  if (left < 10) left = 10

  const moreWidth = 20; // 额外预留10px

  trackContentStyle.value = {
    left: `${left - moreWidth / 2}px`,
    top: `${rect.bottom + 4}px`,
    width: `${panelWidth + moreWidth}px`
  }
}

// closeClipContent：关闭浮动面板 + 收起下拉菜单
function closeClipContent() {
  activeClipId.value = null
  activeSegment.value = null
  isShowTrackDropdown.value = false
}

// deleteClip：按 clipId 从 timelineData.clips 中删除该动画配置
function deleteClip(clipId: string) {
  const newClips = timelineState.timelineData.clips.filter(c => c.clipId !== clipId)
  timelineState.timelineData = { ...timelineState.timelineData, clips: newClips }
  closeClipContent()
}

// toggleCollapse：对象轨道折叠/展开（预留功能，未来每对象多轨道时可头部点击折叠展开；TS 未使用提示不影响）
// 切换 collapsedClips Set：存在则删除，不存在则添加
function toggleCollapse(entityId: string) {
  const next = new Set(collapsedClips.value)
  if (next.has(entityId)) {
    next.delete(entityId)
  } else {
    next.add(entityId)
  }
  collapsedClips.value = next
}

// getCurvePoints：计算 SVG polyline 曲线上每个点
//  - opacity：y 轴映射 0~1 → 18~2（越大越靠上）
//  - visible：true/false → y=4/16
//  - 其他类型：默认水平线 y=10
//  x 轴根据 keyframe.time 在 [startTime, endTime] 之间做百分比换算
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

// isKeyframeSelected：通过 clipId + trackType + keyframe 引用比较，判断选中态（红色高亮
function isKeyframeSelected(clipId: string, trackType: string, keyframe: Keyframe): boolean {
  return selectedKeyframe.value?.clipId === clipId &&
    selectedKeyframe.value?.trackType === trackType &&
    selectedKeyframe.value?.keyframe === keyframe
}

// ========== 关键帧属性编辑：调用 entity.getEditPropConfigData 动态构造 DataTypeEditPanel ==========
const editPropConfigInfo = ref<editItem[]>([])
const editPropInputInfo = ref<any>({})
const editPropTypeKey = ref<string>()
// contextMenu：编辑面板弹出位置（mouseX/mouseY）
const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
} | null>(null)
// editPropConfigEditCallback：DataTypeEditPanel 面板输入变化的回写回调
// 默认空实现，点击具体 keyframe 时会被 onKeyframeClick 覆写为「回写到对应 keyframe.value」的逻辑
let editPropConfigEditCallback = (_val: any) => {
  // noop - 占位默认实现，onKeyframeClick 中会动态赋值
}

// onKeyframeClick：点击关键帧节点时触发
// 执行顺序：
// 1) 若本次是拖拽结束（dragMoved=true）→ 不触发 click 逻辑，直接返回
// 2) 播放中 → 自动 togglePlay() 暂停
// 3) 找到 worldApi 中的 entity 实例
// 4) 写 editPropConfigEditCallback：DataTypeEditPanel 输入变化时回写 keyframe.value
// 5) 读取 entity.getEditPropConfigData，过滤出当前 trackType 对应的 editItem，打开 DataTypeEditPanel
// 6) 设置 selectedKeyframe（用于样式高亮红色选中态）
// 7) 赋值 window.activekeyFrameNode 全局变量，供外部模块（如属性面板）访问当前选中关键帧
function onKeyframeClick(event: MouseEvent, clipId: string, entityId: string, trackType: string, keyframe: Keyframe) {
  // 区分「click」和「drag结束」：若鼠标移动超过阈值则不触发点击
  if (dragMoved) {
    dragMoved = false
    return
  }
  // 播放中操作关键帧 → 自动暂停，避免播放与编辑冲突
  if (isPlaying.value) {
    togglePlay()
  }
  // 从 worldApi 场景根节点下查找匹配 entityId 的实体对象
  const entity = window.worldApi.children.find(v => v.getData().id === entityId)
  if (!entity) return;

  // 编辑面板回调：用户在 DataTypeEditPanel 修改值后，自动同步到当前 keyframe.value
  editPropConfigEditCallback = (val: any) => {
    keyframe.value = val[trackType]
  }

  // 读取 entity 的可编辑属性配置（支持 Promise/同步两种返回），匹配 trackType 后弹面板
  function callback(config: editItem[]) {
    const match = config.find(v => v.id === trackType)
    if (!match) return
    // 面板配置：仅展示当前 trackType 对应的单个字段
    editPropConfigInfo.value = [match]
    editPropTypeKey.value = entity!.type;
    // 面板初始值：取 keyframe.value 回填
    const inputData: any = {
      [trackType]: keyframe.value
    }
    editPropInputInfo.value = inputData;
    // 面板定位：跟随鼠标点击位置（clientX/clientY）
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
  // 记录选中态（红色高亮 + 外部引用）
  selectedKeyframe.value = { clipId, entityId, trackType, keyframe }
  // 写全局变量：让外部模块（如属性面板/控制台调试）可以访问当前选中的关键帧引用
  // 注意：使用小写 k 命名 activekeyFrameNode，与用户需求严格一致
  // @ts-ignore - 全局动态属性，Window 类型上未预定义
  window.activekeyFrameNode = { clipId, entityId, trackType, keyframe }
}

// watch：编辑面板输入变化（deep watch）时触发回写回调
watch(() => editPropInputInfo.value, () => {
  if (contextMenu.value?.visible) {
    editPropConfigEditCallback(editPropInputInfo.value)
  }
}, {
  deep: true
})

// handleTrackClick：在 track-timeline 空白处点击 → 在该时间点插入关键帧
//  - 时间被 clamp 在 clip 的 [startTime, endTime]
//  - 按 trackType 预设默认值（position/rotation → {x:0,y:0,z:0}，opacity→1，等
//  - 插入后 keyframes 按时间排序并触发响应式更新
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
  const endTime = segment ? segment.endTime : effectiveDuration.value
  const time = Math.max(startTime, Math.min(endTime, startTime + (x / rect.width) * segDuration))

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

  // timelineData___.value = { ...timelineData___.value }
  timelineState.timelineData = { ...timelineState.timelineData }
}

// togglePlay：播放/暂停切换按钮点击处理
// 关键规则：
//  - 开始播放前必须检查 overlappingClipIds：若存在同一对象多 clip 时间重叠 → 调用 message.warning 拦截
//  - 开始播放：设置，记录 lastTimestamp，启动 playLoop
//  - 暂停播放：不修改 timelineState.isPlaying（保持 true，因为当前仍处于时间轴评估态），仅 cancelAnimationFrame 中止主循环
function togglePlay() {
  // 播放前检查：存在时间重叠的 clip 时禁止播放，提示用户手动调整
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

// stop：停止播放并重置到 0 秒
// 执行顺序：
// 1) 设置 isPlaying=false 中止 playLoop 循环
// 3) currentTime 归零到起始点
// 4) cancelAnimationFrame 取消待执行的帧回调，防止内存泄漏
// 5) evaluateTimeline(0)：重新计算 0 秒时所有实体的初始态并写入 setTempData
function stop() {
  isPlaying.value = false
  timelineState.currentTime = 0
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  evaluateTimeline(0)
}

// playLoop：requestAnimationFrame 播放主循环
//  - 使用 performance.now 计算帧间 deltaTime，与 playbackSpeed 相乘得播放推进量
//  - 到时间尾回到 0 秒（循环播放）
//  - 每帧调用 evaluateTimeline 重新计算场景状态
function playLoop() {
  if (!isPlaying.value) return

  const now = performance.now()
  const deltaTime = (now - lastTimestamp) / 1000
  lastTimestamp = now

  timelineState.currentTime += deltaTime * playbackSpeed.value

  if (timelineState.currentTime >= effectiveDuration.value) {
    timelineState.currentTime = 0
  }

  evaluateTimeline(timelineState.currentTime)

  animationFrameId = requestAnimationFrame(playLoop)
}

// startDragging / onDrag / stopDragging：playhead-line（红色竖线）拖拽
//  - onDrag：基于 timeline-content-wrapper 宽度 换算 time，clamp 在 [0, effectiveDuration]
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

  timelineState.currentTime = Math.max(0, Math.min(time, effectiveDuration.value))
  evaluateTimeline(timelineState.currentTime)
}

function stopDragging() {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
}

// startClipDrag：track-item 整体拖拽
//  - 播放中 → 自动暂停
//  - 记录 dragStartClipRange（clip 边界）和 dragStartTimes（每个轨道 keyframes 原始时间）
//  - 拖拽时：clip.startTime/endTime 按原 duration 平移 + 内部 keyframes 同步偏移相同 deltaTime
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
  dragStartClipRange = null

  if (activeClipId.value) {
    closeClipContent()
  }

  const clip = timelineState.timelineData.clips.find(c => c.clipId === clipId)
  if (clip) {
    dragStartClipRange = { startTime: clip.startTime, endTime: clip.endTime }
    for (const track of clip.tracks) {
      const times = track.keyframes.map(kf => kf.time)
      dragStartTimes.set(track.trackType, times)
    }
  }

  document.addEventListener('mousemove', onClipDrag)
  document.addEventListener('mouseup', stopClipDrag)
}

// onClipDrag：track-item 拖拽实时位置计算
//  - 宽度换算 deltaTime = deltaX / (rect.width / effectiveDuration)
//  - 关键：基于 dragStartClipRange / dragStartTimes 计算新值，避免每帧累积误差
//  - startTime 不能小于 0（Math.max(0, ...)），endTime = newStartTime + duration 维持时长
function onClipDrag(e: MouseEvent) {
  if (!isDraggingClip || !dragClipId || !dragStartClipRange) return

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

  const clip = timelineState.timelineData.clips.find(c => c.clipId === dragClipId)
  if (!clip) return

  const duration = dragStartClipRange.endTime - dragStartClipRange.startTime
  const newStartTime = Math.max(0, dragStartClipRange.startTime + deltaTime)
  const newEndTime = newStartTime + duration

  clip.startTime = newStartTime
  clip.endTime = newEndTime

  for (const track of clip.tracks) {
    const originalTimes = dragStartTimes.get(track.trackType)
    if (!originalTimes) continue

    for (let i = 0; i < track.keyframes.length; i++) {
      if (originalTimes[i] !== undefined) {
        track.keyframes[i].time = Math.max(0, originalTimes[i] + deltaTime)
      }
    }
  }
  // timelineData___.value = { ...timelineData___.value }
  timelineState.timelineData = { ...timelineState.timelineData }
}

function stopClipDrag() {
  isDraggingClip = false
  dragClipId = null
  dragStartTimes.clear()
  dragStartClipRange = null
  document.removeEventListener('mousemove', onClipDrag)
  document.removeEventListener('mouseup', stopClipDrag)
}

// startKeyframeDrag：单个关键帧拖拽
//  - 找到所在 .track-timeline 容器作为基准宽度换算容器
//  - 记录 dragKeyframeInfo 快照（边界+原始时间），拖拽过程中不累积修改
function startKeyframeDrag(e: MouseEvent, clipId: string, trackType: string, keyframe: Keyframe) {
  e.stopPropagation()
  if (isPlaying.value) {
    togglePlay()
  }

  const clip = timelineState.timelineData.clips.find(c => c.clipId === clipId)
  if (!clip) return

  const trackTimeline = (e.currentTarget as HTMLElement).closest('.track-timeline') as HTMLElement
  const container = trackTimeline || document.querySelector('.track-timeline') as HTMLElement

  isDraggingKeyframe = true
  dragKeyframeStartX = e.clientX
  dragMoved = false
  dragKeyframeInfo = {
    clipId,
    trackType,
    keyframe,
    startTime: clip.startTime,
    endTime: clip.endTime,
    originalTime: keyframe.time,
    container,
  }

  document.addEventListener('mousemove', onKeyframeDrag)
  document.addEventListener('mouseup', stopKeyframeDrag)
}

// onKeyframeDrag：关键帧拖拽位置换算
//  - 用容器 rect.width 与 clip.duration 换算 widthPerSecond
//  - 关键帧时间 clamp 在 [clip.startTime, clip.endTime] 之间（不能越过 clip 边界
function onKeyframeDrag(e: MouseEvent) {
  if (!isDraggingKeyframe || !dragKeyframeInfo) return

  const container = dragKeyframeInfo.container
  if (!container) return

  const rect = container.getBoundingClientRect()
  const clipDuration = dragKeyframeInfo.endTime - dragKeyframeInfo.startTime
  const widthPerSecond = rect.width / clipDuration
  const deltaX = e.clientX - dragKeyframeStartX

  if (Math.abs(deltaX) > 2) {
    dragMoved = true
  }

  if (!dragMoved) return

  const deltaTime = deltaX / widthPerSecond
  const newTime = Math.max(
    dragKeyframeInfo.startTime,
    Math.min(dragKeyframeInfo.endTime, dragKeyframeInfo.originalTime + deltaTime)
  )

  dragKeyframeInfo.keyframe.time = newTime
  // timelineData.value = { ...timelineData.value }
  timelineState.timelineData = { ...timelineState.timelineData }
}

function stopKeyframeDrag() {
  isDraggingKeyframe = false
  dragKeyframeInfo = null
  document.removeEventListener('mousemove', onKeyframeDrag)
  document.removeEventListener('mouseup', stopKeyframeDrag)
}

// evaluateTimeline：核心评估函数，给定 time 秒，重新计算场景中所有实体状态
//
// 执行逻辑分三种互斥情况（根据 time 与所有 clip 的位置关系）：
//   1) time 落在某个 clip 的开区间 (startTime, endTime) 内 → matchIndex >= 0（命中插值）
//      对该 clip 的每个轨道，调用 evaluateTrack 做线性/步进/缓动插值，结果写入 data 映射表
//      最后通过 entity.setTempData 合并写入（插值运算仅在当前 clip 区间内生效）
//
//   2) time 在所有 clips 之前，即 time < 最早 clip.startTime → 取第 0 个 clip 的对应 entity
//      由于动画尚未开始，所有轨道值取 entity.getData() 的「原始初始值」写入 setTempData
//      （保证播放头拖到 0 秒附近时，对象还未开始动的状态正确显示）
//
//   3) 其他情况（time >= 某个 clip.endTime，即空隙中 / 所有 clip 之后）
//      用 reduce 找到 matchPreIndex：满足 clip.endTime <= time 且 endTime 最大的那个 clip
//      然后取该 clip 每个轨道 keyframes 的「最后一个值」（最终态）写入 setTempData
//      （保证动画结束后，对象停留在最后一帧的状态，而不是跳回初始值）
//
//   判断当前 setTempData 写入来源是「时间轴评估结果」还是「用户手动修改」，
//   避免两者互相覆盖。因此在写入 entity.getData() 初始值之前临时设为 false，之后立刻恢复 true。
function evaluateTimeline(time: number) {
  // 先尝试查找 time 落在哪个 clip 的 (startTime, endTime) 开区间内
  const matchIndex = timelineState.timelineData.clips.findIndex(clip => {
    return time > clip.startTime && time < clip.endTime
  })

  if (matchIndex === -1) {
    if (timelineState.timelineData.clips.length > 0) {
      let match: ClipData;
      const data: any = {}
      // --- 情况2：time 在所有 clip 之前（还没开始第一个动画） ---
      if (time < timelineState.timelineData.clips[0].startTime) {
        match = timelineState.timelineData.clips[0];
        if (match) {
          const entity = window.worldApi.children.find(v => {
            return v.getData().id === match.entityId
          })
          if (!entity) return;
          match.tracks.forEach(track => {
            const { trackType } = track;
            // @ts-ignore - trackType 为动态字符串，Entity 接口无法穷举
            data[trackType] = entity.getData()[trackType] as any;
          })
          entity.setAnimationData({
            ...entity.getAnimationData(),
            ...data,
          });
        }
      } else {
        // --- 情况3：time 在至少一个 clip 之后（取最近已结束 clip 的最终态） ---
        // reduce 遍历 clips：找出满足 endTime <= time 且 endTime 最大的 clip 索引（即「上一段已结束动画」）
        const matchPreIndex = timelineState.timelineData.clips.reduce((preIndex, clip, index) => {
          if (clip.endTime <= time) {
            if (preIndex === -1 || clip.endTime > timelineState.timelineData.clips[preIndex].endTime) {
              return index
            }
          }
          return preIndex
        }, -1)
        match = timelineState.timelineData.clips[matchPreIndex];
        if (match) {
          const entity = window.worldApi.children.find(v => {
            return v.getData().id === match.entityId
          })
          if (!entity) return;
          match.tracks.forEach(track => {
            const { trackType, keyframes } = track;
            // 每个轨道取最后一个 keyframe 的 value（动画结束的定格状态）；无 keyframes 跳过
            if (keyframes.length > 0) {
              const lastValue = keyframes[keyframes.length - 1].value;
              data[trackType] = lastValue;
            }
          })
          entity.setAnimationData({
            ...entity.getAnimationData(),
            ...data,
          });
        }
      }
    }
  } else if (matchIndex > -1) {
    // --- 情况1：命中某个 clip 区间 → 对每个轨道执行关键帧插值 ---
    const match = timelineState.timelineData.clips[matchIndex];
    const entity = window.worldApi.children.find(v => {
      return v.getData().id === match.entityId
    })
    if (!entity) return;

    const data: any = {}
    // if (time < timelineState.timelineData.clips[0].startTime) {
    match.tracks.forEach(track => {
      // console.log('evaluateTimeline', track, time)
      const { keyframes, trackType } = track;
      if (keyframes.length === 0) {
        return
      }
      const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time)

      if (time < sortedKeyframes[0].time) {
        // sortedKeyframes 头部添加
        let valuePre: number | undefined | null;
        // console.log('sortedKeyframes-1', sortedKeyframes)
        const firstClipTrack = timelineState.timelineData.clips[0].tracks.find(v => {
          return v.trackType === trackType
        })
        if (firstClipTrack && time < firstClipTrack.keyframes[0].time) {
          valuePre = (entity.getOriginalData() as any)[trackType] as number;
        } else {
          const matchPreIndex = timelineState.timelineData.clips.reduce((preIndex, clip, index) => {
            if (clip.endTime <= time) {
              if (preIndex === -1 || clip.endTime > timelineState.timelineData.clips[preIndex].endTime) {
                return index
              }
            }
            return preIndex
          }, -1)
          const match = timelineState.timelineData.clips[matchPreIndex];
          if (match) {
            valuePre = match.tracks.find(t => t.trackType === trackType)?.keyframes[keyframes.length - 1].value;
          }
          console.log('sortedKeyframes-2', sortedKeyframes)
        }
        if (valuePre !== undefined && valuePre !== null) {
          sortedKeyframes.unshift({
            time: timelineState.timelineData.clips[matchIndex].startTime,
            value: valuePre,
            easing: 'linear',
          })
        }
      }
      // evaluateTrack 返回 null / undefined 时，不写入该轨道（保持 setTempData 中之前的值）
      const value = evaluateTrack(sortedKeyframes, time)
      if (value !== null) {
        data[trackType] = value;
      }
    })
    entity.setAnimationData({
      ...entity.getAnimationData(),
      ...data,
    });
  }
}

// evaluateTrack：对单个轨道 + 给定时间进行关键帧插值求值
//  - 0 个关键帧：null；1 个关键帧：直接取该值（无插值）
//  - 时间 < 首个 keyframe 或 > 最后 keyframe：返回 null（该轨道不生效）
//  - 其他：二分查找左右相邻 keyframe，根据 easing 计算 t，
function evaluateTrack(keyframes: Keyframe[], time: number): null | number {
  if (keyframes.length === 0) return null
  if (keyframes.length === 1) return keyframes[0].value

  // 当时间在关键帧范围外时，返回 null 表示该 clip 不应在此时间段内生效
  if (time < keyframes[0].time) return null
  if (time > keyframes[keyframes.length - 1].time) return null

  let leftIndex = 0
  let rightIndex = keyframes.length - 1

  while (leftIndex < rightIndex - 1) {
    const midIndex = Math.floor((leftIndex + rightIndex) / 2)
    if (keyframes[midIndex].time <= time) {
      leftIndex = midIndex
    } else {
      rightIndex = midIndex
    }
  }

  const leftKeyframe = keyframes[leftIndex]
  const rightKeyframe = keyframes[rightIndex]

  const totalDuration = rightKeyframe.time - leftKeyframe.time
  let t = (time - leftKeyframe.time) / totalDuration

  if (leftKeyframe.easing) {
    t = applyEasing(t, leftKeyframe.easing)
  }

  return leftKeyframe.value + (rightKeyframe.value - leftKeyframe.value) * t
}

// applyEasing：缓动函数（以左关键帧 easing 为准）
//  - linear：t
//  - easeIn：二次方进入（t²）
//  - easeOut：二次方退出（2t - t²）
//  - easeInOut：前段 2t²，后段 2*(2-2t)*t -1
function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'easeIn': return t * t
    case 'easeOut': return t * (2 - t)
    case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    default: return t
  }
}

// availableTrackTypes：点击「＋ 添加属性」下拉菜单的候选项（动态读取 entity 的编辑配置生成
const availableTrackTypes = ref<{
  id: string,
  label: string,
}[]>([])

// addTrack：将选中的轨道类型 push 到 clip.tracks，空 keyframes，之后用户在轨道上点击才能增加关键帧
function addTrack(trackType: string) {
  if (!activeSegment.value) return
  const newTrack: TrackData = {
    trackType,
    keyframes: [],
    interpolation: 'linear'
  }
  activeSegment.value.clip.tracks.push(newTrack)
  // timelineData___.value = { ...timelineData___.value }
  timelineState.timelineData = { ...timelineState.timelineData }
  isShowTrackDropdown.value = false
}

// removeTrack：移除指定类型的轨道（浮动面板 track-label 上的 ✕ 按钮
function removeTrack(trackType: string) {
  if (!activeSegment.value) return
  const clip = activeSegment.value.clip
  clip.tracks = clip.tracks.filter(t => t.trackType !== trackType)
  // timelineData___.value = { ...timelineData___.value }
  timelineState.timelineData = { ...timelineState.timelineData }
}

// showTrackDropdown：点击「＋ 添加属性」按钮时展开下拉菜单
// 读取对应 entity 的 getEditPropConfigData（支持同步/Promise 返回），
// 将配置中的可编辑字段映射为 {id, label} 列表填充 availableTrackTypes 并展开下拉。
// 注意：下拉项可能包含非动画属性，由用户自行选择是否需要添加为轨道。
function showTrackDropdown() {
  if (!activeSegment.value) return;
  const { entityId } = activeSegment.value.clip
  const entity = window.worldApi.children.find(v => v.getData().id === entityId)
  if (!entity) return;

  function callback(config: editItem[]) {
    // 先清空旧数据避免重复累加
    availableTrackTypes.value = config.map(v => {
      return {
        id: v.id,
        label: v.label
      }
    })
    isShowTrackDropdown.value = true
  }
  const config = entity.getEditPropConfigData(entity.getData())
  if (config instanceof Promise) {
    config.then(callback)
  } else {
    callback(config)
  }
}

// onUnmounted：组件卸载时清理动画帧与事件监听，避免内存泄漏
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
})
</script>

<style scoped lang="less">
// ============================================================
// 时间轴整体布局样式
// .timeline-container：外层根容器，flex 纵向三行排列
//   ├─ .timeline-header：控制栏（标题+时间+播放按钮+倍速+缩放）
//   ├─ .timeline-ruler：时间刻度标尺（单独高度 24px，不参与滚动容器内滚动）
//   └─ .timeline-scroll-container：轨道滚动区域（横向+纵向滚动条）
//        └─ .timeInfo：CSS Grid 双层叠加（内容层 + 播放头层）
//             ├─ .timeline-content-wrapper：轨道内容（track-item / keyframe）
//             └─ .playhead-container：播放头贯穿竖线
// ============================================================
.timeline-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column; // 头部 / 标尺 / 轨道 纵向堆叠
  overflow: hidden;
  font-family: 'Segoe UI', sans-serif;

  // 头部控制栏：左侧标题+当前时间，右侧停止/播放/倍速滑块/缩放按钮
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    border-bottom: 1px solid #0f3460; // 与标尺区域的分隔线

    // 左侧区域：标题 + 当前时间 / 总时长
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .title {
        font-size: 16px;
        font-weight: bold;
        color: #e94560; // 品牌红色标题
      }

      // 时间显示：等宽字体，数字对齐不跳动
      .time-display {
        font-size: 14px;
        color: #a8b2d1;
        font-family: monospace;
      }
    }

    // 右侧区域：停止 ▶⏸ 倍速 缩放
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;

      // 通用方形控制按钮（停止 / 播放 / 缩放加减）
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
          background: #1a4d7a; // 悬浮时稍亮的蓝色
        }
      }

      // 倍速滑块范围 0.1~3.0
      .speed-control {
        width: 80px;
        height: 6px;
        cursor: pointer;
      }

      // 倍速 / 缩放百分比标签
      .speed-label {
        font-size: 12px;
        color: #a8b2d1;
        min-width: 30px; // 防止倍速 0.x 和 3.x 抖动宽度
      }
    }
  }

  // 滚动容器：承载 timeInfo 的外层，负责纵向/横向滚动条，留出周围 4px padding
  .timeline-scroll-container {
    flex: 1; // 占剩余全部高度
    overflow-x: auto;
    overflow-y: auto;
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: start;
    padding: 0 4px 4px 4px;

    // timeInfo：核心「双层叠加」区域，使用 CSS Grid 让 content / playhead 占同一格
    // 两层互不干扰，content 负责点击/拖拽 track-item，playhead 贯穿显示红色竖线
    .timeInfo {
      flex-grow: 1;
      flex-shrink: 1;
      overflow-x: auto;
      overflow-y: auto;
      height: 100%;
      display: grid;
      grid-template-areas: "layer"; // 同名列，两个子元素都占 layer 实现叠加

      // === 第一层：轨道内容层（承载所有 timeline-row + track-item + keyframes） ===
      .timeline-content-wrapper {
        grid-area: layer;
        position: relative;
        display: flex;
        flex-direction: column;
        // 宽度 = effectiveDuration * zoomLevel * 50，由模板 :style 内联注入
      }

      // === 第二层：播放头容器（红色半透明竖线） ===
      // pointer-events: none → 默认不拦截点击，但内部 .playhead-line 单独覆盖开启（拖拽句柄）
      // z-index: 100 → 高于 track-item（z-index:5），保证竖线视觉上始终在最上层
      .playhead-container {
        grid-area: layer;
        position: relative;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 100;

        // .playhead-line：红色半透明竖线，2px 宽度 + 发光阴影，可作为拖拽手柄（ew-resize）
        .playhead-line {
          position: absolute;
          top: 0;
          width: 2px;
          height: 100%;
          background: rgba(233, 69, 96, 0.6);
          cursor: ew-resize; // 左右箭头光标，提示可拖拽
          pointer-events: auto; // 单独开启事件（覆盖父级的 none）
          box-shadow: 0 0 6px rgba(233, 69, 96, 0.3);
        }
      }

      .timeline-content-wrapper {

        // timeline-track-area：所有 timeline-row 的父容器
        .timeline-track-area {
          padding-top: 8px; // 顶部留白，避免 row0 贴边
          overflow-y: auto;
          box-sizing: border-box;
          position: relative;

          .track-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          // timeline-row：每一行 35px，绝对定位 track-item 的基准容器
          // 同一行内的多个 clip 时间互不冲突（由区间图着色算法保证）
          .timeline-row {
            position: relative;
            height: 35px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03); // 行间极细分割线

            // track-item：单个 clip 的视觉表示，绝对定位 left / width 按百分比占 timeline-row
            .track-item {
              position: absolute;
              border-radius: 6px;
              overflow: visible; // warning-badge 要溢出右上角
              border: 1px solid #1a4d7a; // 深蓝边框
              box-sizing: border-box; // 包含 border/padding 入宽度，与 track-item 计算宽度一致
              min-width: 20px; // 极端缩放下仍能点击
              z-index: 5;
              height: 35px;
              top: 0;
              cursor: move; // 十字移动光标（按住可整体拖动 clip）
              background: rgba(15, 52, 96, 0.4); // 深蓝半透明背景
              transition: box-shadow 0.15s;

              &:hover {
                box-shadow: 0 0 0 1px rgba(233, 69, 96, 0.5); // 悬浮红色描边高亮
              }

              // active：当前打开了浮动编辑面板的 clip，更亮的红色边框 + 更高 z-index
              &.active {
                box-shadow: 0 0 0 1px #e94560;
                z-index: 50;
              }

              // warning：同一 entityId 多个 clip 时间重叠时，替换为橙色 + 脉冲动画
              &.warning {
                border-color: #ff9800;
                background: rgba(255, 152, 0, 0.2);
                animation: warning-pulse 1.5s ease-in-out infinite;

                &:hover {
                  box-shadow: 0 0 0 1px #ff9800; // hover 也改为橙色
                }
              }

              // warning-badge：时间重叠警告徽章（⚠ + 文字）
              .warning-badge {
                position: absolute;
                top: -8px;
                right: -6px; // 超出 track-item 右边界 6px
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
                white-space: nowrap; // 文字不换行
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

              // 按住拖拽 clip 时：光标改为 grabbing（手型抓紧）
              &:active {
                cursor: grabbing;
              }

              // track-header-bar：track-item 内部紧凑信息行（对象名 + 时间范围），高度 35px 居中
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
                  max-width: 100px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap; // 过长 entityId 截断成 ...
                }

                .clip-duration {
                  color: #023068;
                  font-size: 10px; // 时间范围小一号
                }
              }
            }
          }
        }
      }
    }
  }

  // .timeline-ruler：顶部时间刻度标尺，高度 24px，与轨道区域独立（不参与内部滚动）
  // ruler-track 实际宽度由内联 style :width="effectiveDuration * zoomLevel * 50" 控制
  .timeline-ruler {
    height: 24px;
    box-sizing: border-box;
    position: relative;
    overflow-x: hidden; // 隐藏标尺自身的横向滚动条（用 timeline-scroll-container 统一滚动）
    margin-left: 4px;

    // 隐藏 webkit 滚动条，避免双滚动条视觉
    &::-webkit-scrollbar {
      display: none;
    }

    // ruler-track：刻度条基准层，实际宽度随缩放改变
    .ruler-track {
      position: relative;
      width: 100%;
      height: 100%;
    }

    // ruler-marks：绝对定位承载所有刻度线
    .ruler-marks {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      // 单条刻度线：默认细线（20% 透明度），major 类额外加粗 + 时间标签
      .ruler-mark {
        position: absolute;
        top: 0;
        width: 1px;
        height: 100%;
        background: rgba(255, 255, 255, 0.2);

        // major：整数秒主刻度（更清晰的 40% 背景 + 左下角标签）
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
}

// ============================================================
// track-content-floating：点击 track-item 弹出的浮动编辑面板
// 通过 <teleport to="#teleport"> 渲染在 body 级 DOM，避免父容器 overflow 裁剪
// 样式说明：
//   - position: fixed 固定定位，位置由模板内联 trackContentStyle（left/top/width）控制
//   - z-index: 999 保证面板始终覆盖 3D 场景 / 时间轴 / 其他 UI
//   - box-sizing: border-box，与触发的 track-item 宽度一致（不溢出）
// ============================================================
.track-content-floating {
  position: fixed;
  z-index: 999;
  border-radius: 6px;
  box-shadow: 0px 1px 16px 3px rgb(0 0 0); // 投影让面板浮出
  box-sizing: border-box;
  overflow: hidden;

  // 面板顶部标题栏：entityId + 时间范围 + 删除按钮 + ×关闭按钮
  .floating-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: black;

    .floating-title {
      font-weight: 500;
      color: white;
      font-size: 13px;
      flex: 1; // 占剩余空间
    }

    .floating-time {
      color: #a8b2d1;
      font-size: 11px; // 时间范围较小号显示
    }

    // 🗑 删除整个 clip 动画配置按钮
    .floating-delete {
      background: none;
      border: none;
      color: #a8b2d1;
      cursor: pointer;
      font-size: 14px;
      padding: 0 4px;
      line-height: 1;

      &:hover {
        color: #f56c6c; // Element-UI 红（hover 提示危险性）
      }
    }

    // × 关闭按钮（仅关闭面板，不删除数据）
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

  // track-row：每个属性轨道一行（左 label + 右 timeline）高度 35px 与 timeline-row 一致
  .track-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
    box-sizing: border-box;
    white-space: nowrap;
    padding: 8px 10px;
    gap: 8px;
    height: 52px;

    // 最后一行不加分隔线
    &:last-child {
      border-bottom: none;
    }

    // 轨道类型标签（position / rotation / opacity ...），固定宽度 70px
    .track-label {
      width: 70px;
      font-size: 11px;
      color: #a8b2d1;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;

      // ✕ 移除轨道按钮：默认透明，hover track-label 时出现
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
          color: #f56c6c; // 红色提醒「删除」语义
        }
      }

      &:hover .track-remove {
        opacity: 1;
      }
    }

    // 轨道时间轴区域：点击空白处可添加关键帧，内部承载关键帧节点 + 插值曲线
    .track-timeline {
      flex: 1;
      position: relative;
      width: 100%;
      height: 100%;
      cursor: crosshair; // 十字光标提示「点击可插入关键帧」

      .track-background {
        position: relative;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.02); // 轻微底色区分行
      }

      // keyframe-node：关键帧圆点节点（绿色默认，红色选中态）
      .keyframe-node {
        position: absolute;
        top: 0;
        width: 12px;
        height: 12px;
        margin-left: -6px; // 左半补偿居中（否则左边对齐而非中心）
        margin-top: -6px;
        border-radius: 50%;
        background: #4CAF50; // 绿色=正常（添加但未选中）
        border: 2px solid #fff;
        cursor: move;
        transition: transform 0.15s, background 0.15s;
        z-index: 2;

        &:hover {
          transform: scale(1.3); // 悬浮放大方便点击
        }

        // selected 选中态：红色背景 + 更大比例 + 红色外发光
        &.selected {
          background: #e94560;
          transform: scale(1.4);
          box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.4);
        }
      }

      // curve-line：SVG polyline 插值曲线预览（opacity / visible / position Y 等映射）
      .curve-line {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: #bababa;
        pointer-events: none; // 不拦截点击（关键帧可穿透点击）
      }
    }
  }

  // 「＋ 添加属性」区域：面板底部，一行虚线按钮 + 向上展开的下拉菜单
  .add-track-area {
    padding: 8px;
    position: relative;
    border-top: solid 1px #d3d3d3;

    // 默认状态：「＋ 添加属性」虚线按钮
    .add-track-select {
      width: 100%;
      padding: 6px 10px;
      background: rgb(229 230 235);
      border-radius: 4px;
      color: black;
      font-size: 12px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
      box-sizing: border-box;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.4);
        color: #fff;
      }
    }

    // 展开状态：下拉菜单，定位到按钮上方（bottom:100%），避免遮挡底部滚动条
    .track-dropdown {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: #1a1a2e; // 深色下拉底色更有层次感
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 6px 0;
      margin-bottom: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      z-index: 100;

      // 「选择属性」标题头
      .track-dropdown-header {
        padding: 4px 10px 6px;
        font-size: 11px;
        color: #a8b2d1;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        margin-bottom: 4px;
      }

      // 属性候选项：hover 时红色高亮
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

      // 取消按钮：关闭下拉不添加
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

// warning-pulse：时间重叠 clip 的橙色脉冲呼吸动画
// 使用 box-shadow spread radius 从 0 → 4px 渐变，模拟外扩发光
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
