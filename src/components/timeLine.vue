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
        <button class="control-btn" :class="{ recording: isRecording }" @click="recordVideoPlay">{{
          isRecording ? '停止 ■' : '录制 ▶'
        }}</button>
        <input type="range" class="speed-control" v-model="playbackSpeed" min="0.1" max="3" step="0.1" />
        <span class="speed-label">{{ playbackSpeed }}倍速</span>
        <button class="control-btn" @click="zoomIn">+</button>
        <button class="control-btn" @click="zoomOut">−</button>
        <span class="speed-label">{{ Math.round(zoomLevel * 100) }}%</span>
      </div>
    </div>

    <!-- 时间标尺：显示主/次刻度，宽度随缩放级别变化，与内容宽度保持一致 -->
    <div class="timeline-ruler" :style="{ marginLeft: (scrollLeft * -1 + moreLeft + 4) + 'px' }" ref="timelineRuler"
      @scroll.prevent.stop>
      <div class="ruler-track" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
        <div class="ruler-marks">
          <!-- ruler-mark.major：整数秒刻度，带时间标签；minor：次级刻度无标签 -->
          <div v-for="mark in rulerMarks" :key="mark.time" class="ruler-mark" :class="{ major: mark.major }"
            :style="{ left: `${(mark.time / effectiveDuration) * 100}%` }">
            <span v-if="mark.major" class="mark-label">{{ formatTime(mark.time) }}</span>
          </div>
        </div>
        <!-- 标尺上的VIP标记：非VIP时在10秒位置显示 -->
        <div v-if="showLockedArea" class="ruler-vip-marker"
          :style="{ left: `${(FREE_DURATION / effectiveDuration) * 100}%` }">
          <span class="ruler-vip-icon">👑</span>
        </div>
      </div>
    </div>

    <!-- 滚动容器：控制轨道区域横向与纵向滚动，onScroll 同步 scrollLeft 状态 -->
    <div class="timeline-scroll-container">
      <!-- timeInfo：使用 CSS Grid 叠加两层（timeline-content-wrapper + playhead-container），使播放头贯穿整个区域 -->
      <div class="timeInfo" @contextmenu.stop.prevent :style="{ paddingLeft: (moreLeft + 4) + 'px' }"
        @mousedown="handleTimeInfoMouseDown" @scroll="onScroll">
        <!-- 轨道内容层：承载所有 timeline-row + track-item，宽度随 zoomLevel 放大 -->
        <div class="timeline-content-wrapper" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
          <div class="timeline-track-area">
            <!-- timeline-row：一行可以放多个互不时间冲突的 track-item（由区间图着色算法分配行号） -->
            <div v-for="(row, rowIndex) in rowsByIndex" :key="`time-row-${rowIndex}`" class="timeline-row">
              <div v-for="segment in row" :key="segment.clip.clipId" class="track-item" :class="{
                active: activeClipId === segment.clip.clipId,
                locked: !props.isVip && segment.startTime >= FREE_DURATION
              }" :style="{
                left: `${(segment.startTime / effectiveDuration) * 100}%`,
                width: `${((segment.endTime - segment.startTime) / effectiveDuration) * 100}%`
              }" @contextmenu.stop.prevent="toggleClipContent($event, segment)">
                <div class="track-header-bar">
                  <span class="clip-name">{{ segment.clip.entityId }}</span>
                  <span class="clip-duration">{{ formatTime(segment.startTime) }} - {{
                    formatTime(segment.endTime) }}</span>
                </div>
                <div v-for="item in getAllTimeInSegment(segment)" :key="item.time" class="keyframe-node"
                  :style="keyFrameStyle(item, segment)" :class="{ selected: item.time === currentTime }"
                  @click.stop="onKeyframeClick(item.time)"
                  @contextmenu.prevent.stop="toggleClipContentFrame($event, segment, item.time)"></div>
              </div>
            </div>
          </div>
          <!-- VIP分界线：非VIP时在10秒位置显示（与timeline-track-area平级） -->
          <div v-if="showLockedArea" class="vip-divider"
            :style="{ left: `${(FREE_DURATION / effectiveDuration) * 100}%` }">
            <div class="vip-divider-line"></div>
            <div class="vip-divider-label">
              <span class="vip-icon">👑</span>
              <span>VIP解锁</span>
            </div>
          </div>
          <!-- 未解锁遮罩层：非VIP时10秒以后的区域（与timeline-track-area平级） -->
          <div v-if="showLockedArea" class="locked-overlay"
            :style="{ left: `${(FREE_DURATION / effectiveDuration) * 100}%`, width: `${((effectiveDuration - FREE_DURATION) / effectiveDuration) * 100}%` }">
            <div class="locked-pattern"></div>
            <div class="locked-text" @click="showBuyVip">
              <span class="locked-big-icon">🔒</span>
              <span class="locked-message">升级VIP解锁更长时长</span>
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
  </div>
</template>

<script lang="ts" setup>
// onMounted 已预留（未来可能需要挂载后初始化标尺同步滚动等），暂未使用
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { message } from '@/utils/message'
// timelineState 模块：管理时间轴状态，clip/track/keyframe 数据结构，以及全局播放状态标志
import { ObjAllColumnData, timelineState } from '@/utils/timelineManage';
import editItem from '@/utils/editItem';
import DataTypeEditPanel from '../views/DataTypeEditPanel.vue'
import showContextMenu from '@/utils/contextMenu';
import evaluateTrack from '@/utils/evaluateTrack';
import { sleep } from '@/utils/sleep';
import getPeopleAnimateOneTime from '@/utils/getPeopleAnimateOneTime';

interface ClipSegment {
  clip: ObjAllColumnData
  startTime: number
  endTime: number
  rowIndex: number
}
const props = defineProps<{
  isVip: boolean
}>()
const effectiveDuration = ref<number>(0)
const rulerMarks = ref<{
  time: number;
  major: boolean;
}[]>([])
const clipSegments = ref<ClipSegment[]>([])

const moreLeft = 70;
const moreRight = 40;
const moreWidth = moreLeft + moreRight; // 额外预留10px
const FREE_DURATION = 10; // 非VIP免费时长（秒）

// 可编辑的最大时间：VIP时不受限制，非VIP时限制在FREE_DURATION
const editableMaxTime = computed(() => {
  if (props.isVip) return effectiveDuration.value
  return Math.min(FREE_DURATION, effectiveDuration.value)
})

// 是否显示未解锁区域：非VIP且总时长超过免费时长
const showLockedArea = computed(() => {
  return !props.isVip && effectiveDuration.value > FREE_DURATION
})

const emits = defineEmits(['showBuyVip'])

onMounted(() => {
  function updateRef() {
    effectiveDuration.value = (() => {
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
      const step = 1;// dur / 20
      // console.log('ddddddd', marks, dur, step);
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
    updateRef()
  })
  currentTime.value = timelineState.currentTime
  timelineState.onChangeCurrentTime(() => {
    currentTime.value = timelineState.currentTime
  })
  evaluateTimeline(timelineState.currentTime)
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
const currentTime = ref(0)                     // 当前播放时间（秒，可小数）
const isPlaying = ref(false)                  // 是否正在播放
const isRecording = ref(false)                // 是否正在录制视频
const playbackSpeed = ref(1)                // 播放倍速（0.1x ~ 3x）
const targetFps = ref(20)                       // 目标帧率（0=不限制，跟随显示器刷新率；例如24=每秒24帧）
const zoomLevel = ref(1)                       // 时间轴横向缩放级别（0.2x ~ 5x）
const scrollLeft = ref(0)                     // 当前横向滚动位置
const collapsedClips = ref<Set<string>>(new Set()) // 折叠的对象轨道集合（预留）
const activeClipId = ref<string | null>(null) // 当前展开浮动面板的 clipId
const activeSegment = ref<ClipSegment | null>(null) // 当前展开浮动面板的 segment（含 startTime/endTime/rowIndex）
const isShowTrackDropdown = ref(false)        // 「添加属性」下拉菜单是否展开

// ========== 非响应式临时状态（拖拽等） ==========
let animationFrameId: number | null = null   // requestAnimationFrame id，用于播放循环
let lastTimestamp = 0                        // 上一帧时间戳，计算 deltaTime
let frameAccumulator = 0                     // 帧率控制累积器（秒），targetFps>0 时生效
let isDragging = false                       // playhead-line（红色竖线）拖拽中标志
let isScrubbing = false                       // 空白区域按下拖动（scrub）播放头标志
let scrubClosedPanel = false                  // scrub 时是否关闭了浮动面板（用于 click 后续逻辑）

// ========== 录制相关状态 ==========
let mediaRecorder: MediaRecorder | null = null  // MediaRecorder 实例
let recordedChunks: Blob[] = []                 // 录制数据块缓存

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

// formatTime：秒 → "08:30"（秒:厘秒），保留两位小数用于紧凑显示
function formatTime(time: number): string {
  const seconds = Math.floor(time)
  const milliseconds = Math.floor((time - seconds) * 100)
  return `${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`
}

// snapTimeToFrame：把任意时间点对齐到 targetFps 对应的帧网格
//  - targetFps <= 0：原样返回
//  - targetFps > 0：对齐到 Math.round(time * fps) / fps，避免浮点漂移
function snapTimeToFrame(time: number): number {
  if (targetFps.value <= 0) return time
  const frameDuration = 1 / targetFps.value
  return Math.round(time / frameDuration) * frameDuration
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
  const x = event.clientX + scrollLeft - moreLeft - 4;
  // console.log('event----', event.clientX, wrapperRect.left, scrollLeft)
  const time = (x / wrapperRect.width) * effectiveDuration.value
  return snapTimeToFrame(Math.max(0, Math.min(time, effectiveDuration.value)))
}

// handleTimeInfoMouseDown：timeInfo 区域 mousedown 统一分发
// 1) 点击在 track-item / track-timeline / keyframe-node / playhead-line 上 → 忽略，让具体元素自行处理
// 2) 当前有浮动面板打开 → 先关闭面板（点击空白收起）
// 3) 其余空白 → 进入 scrub 模式（按下+移动=实时拖动播放头，按下+立即松开=跳转时间）
function handleTimeInfoMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('.keyframe-node') || target.closest('.track-timeline') || target.closest('.track-header') || target.closest('.playhead-line')) {
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
// 非VIP限制：不能超过免费时长
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
  // console.log('target.scrollLeft', target.scrollLeft)
  scrollLeft.value = target.scrollLeft
}

// toggleClipContent：track-item 点击时，切换浮动面板显示/隐藏
// 点击同一个 clip 的 track-item → 关闭；点击不同 clip → 先关闭再打开
// 打开面板时：暂停播放（正在播放时），并根据 track-item DOM 位置计算面板 left/top/width
// 非VIP限制：不能编辑10秒以后的clip
function toggleClipContent(event: MouseEvent, segment: ClipSegment) {
  // 非VIP限制：禁止打开10秒以后的clip编辑面板
  if (!props.isVip && segment.startTime >= FREE_DURATION) {
    message.warning('升级VIP解锁更长时长编辑功能')
    return
  }

  if (activeClipId.value === segment.clip.clipId) {
    closeClipContent()
    return
  }

  if (isPlaying.value) {
    togglePlay()
  }

  showContextMenu(event, [
    {
      title: '删除动画',
      icon: '🗑',
      danger: true,
      callback: () => deleteClip(segment.clip.clipId),
    },
  ])
}

function keyFrameStyle(item: { time: number, timeLength: number }, segment: ClipSegment) {
  return {
    left: `${((item.time - segment.startTime) / (segment.endTime - segment.startTime || 1)) * 100}%`,
    width: `${(item.timeLength / (segment.endTime - segment.startTime || 1)) * 100}%`
  }
}
function getAllTimeInSegment(segment: ClipSegment): Array<{
  time: number,
  timeLength: number,
}> {
  const allTimes: Array<number> = []
  const allReturn: Array<{
    time: number,
    timeLength: number,
  }> = []
  segment.clip.columns.forEach(track => {
    track.keyTimePoints.forEach(kf => {
      if (!allTimes.includes(kf.time)) {
        allTimes.push(kf.time)
        allReturn.push({
          time: kf.time,
          timeLength: kf.type === 'animation' ? kf.timeLength : 0,
        })
      }
    })
  })
  return allReturn
}

function toggleClipContentFrame(event: MouseEvent, segment: ClipSegment, time: number) {
  // 播放中操作关键帧 → 自动暂停，避免播放与编辑冲突
  if (isPlaying.value) {
    togglePlay()
  }
  timelineState.currentTime = snapTimeToFrame(time);
  evaluateTimeline(timelineState.currentTime)
  showContextMenu(event, [
    {
      title: '删除节点',
      icon: '🗑',
      danger: true,
      callback: () => {
        segment.clip.columns.forEach(track => {
          track.keyTimePoints.forEach(kf => {
            if (kf.time === time) {
              track.keyTimePoints = track.keyTimePoints.filter(k => k.time !== time)
            }
          })
        })
        // 把所有keyTimePoints长度是0的track删除掉
        segment.clip.columns = segment.clip.columns.filter(track => track.keyTimePoints.length > 0)
        // 如果segment.clip.tracks为空，删除该clip
        if (segment.clip.columns.length === 0) {
          deleteClip(segment.clip.clipId)
        }
      },
    },
  ])
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

// onKeyframeClick：点击关键帧节点时触发
// 执行顺序：
// 1) 若本次是拖拽结束（dragMoved=true）→ 不触发 click 逻辑，直接返回
// 2) 播放中 → 自动 togglePlay() 暂停
// 3) 找到 worldApi 中的 entity 实例
// 4) 写 editPropConfigEditCallback：DataTypeEditPanel 输入变化时回写 keyframe.value
// 5) 读取 entity.getEditPropConfigData，过滤出当前 trackType 对应的 editItem，打开 DataTypeEditPanel
// 6) 设置 selectedKeyframe（用于样式高亮红色选中态）
function onKeyframeClick(time: number) {
  // 播放中操作关键帧 → 自动暂停，避免播放与编辑冲突
  if (isPlaying.value) {
    togglePlay()
  }
  timelineState.currentTime = snapTimeToFrame(time);
  evaluateTimeline(timelineState.currentTime)
}

// togglePlay：播放/暂停切换按钮点击处理
// 关键规则：
//  - 开始播放前必须检查 overlappingClipIds：若存在同一对象多 clip 时间重叠 → 调用 message.warning 拦截
//  - 开始播放：设置，记录 lastTimestamp，启动 playLoop
//  - 暂停播放：不修改 timelineState.isPlaying（保持 true，因为当前仍处于时间轴评估态），仅 cancelAnimationFrame 中止主循环
function togglePlay() {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    lastTimestamp = performance.now()
    frameAccumulator = 0
    playLoop()
  } else if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// downloadBlob：通用 Blob 下载工具
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// stopRecordingAndExport：停止录制 → 转码 MP4 → 下载（转码失败兜底下载 WebM，避免白录）
//  - 由 playLoop 在录制模式下达到 editableMaxTime 时自动调用
//  - 若外部需要手动中止录制，也可以直接调用
function stopRecordingAndExport() {
  // 1) 停止播放循环
  isPlaying.value = false
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  // 2) 停止 MediaRecorder → 直接下载浏览器录制的原始文件（不做任何转码/封装，秒出）
  //    优先 MP4，浏览器不支持就下 WebM。完全砍掉 FFmpeg 转换逻辑。
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = () => {
      const timestamp = Date.now()
      try {
        const recorderMime = mediaRecorder?.mimeType || 'video/webm'
        const recordedBlob = new Blob(recordedChunks, { type: recorderMime })

        // 先重置录制状态（让按钮恢复可点击）
        isRecording.value = false

        if (recordedBlob.size < 1024) {
          message.error('录制内容为空，请重试')
          return
        }

        // 按实际容器选扩展名
        const ext = /^video\/mp4/i.test(recorderMime) ? 'mp4' : 'webm'
        const sizeMB = (recordedBlob.size / 1024 / 1024).toFixed(2)
        console.log(`[stopRecordingAndExport] 直接导出 ${ext.toUpperCase()}，编码 =`, recorderMime, `大小 = ${sizeMB} MB`)
        downloadBlob(recordedBlob, `timeline-recording-${timestamp}.${ext}`)
        message.success(`录制完成（${ext.toUpperCase()}），视频大小：${sizeMB} MB`)
      } catch (e) {
        console.error('导出录制视频失败', e)
        message.error('导出录制视频失败')
      } finally {
        mediaRecorder = null
        recordedChunks = []
      }
    }
    mediaRecorder.stop()
  } else {
    // MediaRecorder 未正常启动，直接清理
    isRecording.value = false
    mediaRecorder = null
    recordedChunks = []
  }
}

function recordVideoPlay() {
  // @ts-ignore
  const canvas: HTMLCanvasElement = window.get3DCanvas();
  if (!canvas) {
    message.error('必须设置至少一个摄像机才可以录制')
    return;
  }
  if (effectiveDuration.value <= 0) {
    message.error('时间轴没有可录制的内容')
    return;
  }

  // 如果正在录制中，点击相当于停止并导出
  if (isRecording.value) {
    stopRecordingAndExport()
    return
  }

  // 1) 重置到起始位置，保证从 0 秒开始录制
  timelineState.currentTime = 0
  frameAccumulator = 0
  evaluateTimeline(0)

  // 2) 初始化 MediaRecorder，从 canvas 捕获视频流
  const recordFps = targetFps.value > 0 ? targetFps.value : 30
  const stream = (canvas as any).captureStream(recordFps)
  recordedChunks = []

  // 选择浏览器支持的最优编码（优先级从快到慢）
  //   1. 直接录 MP4 容器 + H.264/AAC → 0 转码时间，秒出
  //      Chrome 103+ 桌面端（macOS/Windows/Linux）支持 avc1
  //   2. 录 WebM 容器但视频用 H.264 → 只需要 -c copy 快速换壳（1~2秒）
  //   3. VP9 WebM → libx264 重编码兜底（最慢，已用 ultrafast 优化）
  // 注意：codecs 字符串必须带双引号部分浏览器才识别；avc1.42E01E = H.264 Baseline Profile Level 3.1（兼容性最好）
  const mimeTypes = [
    // --- Tier 1：直接 MP4 容器 ---
    'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',  // Chrome 103+ macOS/Win/Linux
    'video/mp4;codecs="avc1,mp4a.40.2"',         // 宽泛写法
    'video/mp4',                                   // 兜底：让浏览器自己挑 codec
    // --- Tier 2：WebM 容器但 H.264 编码 ---
    'video/webm;codecs="avc1.42E01E,opus"',       // Chrome 支持 WebM 里装 H.264
    'video/webm;codecs="avc1,opus"',
    'video/webm;codecs="h264,opus"',
    // --- Tier 3：VP9 / VP8 兜底（需重编码） ---
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ]
  const selectedMime = mimeTypes.find(t => {
    try { return MediaRecorder.isTypeSupported(t) } catch { return false }
  })
  console.log('[recordVideoPlay] 浏览器最终选定 MediaRecorder mimeType =', selectedMime ?? '(默认)')

  try {
    mediaRecorder = new MediaRecorder(
      stream,
      selectedMime ? { mimeType: selectedMime } : undefined
    )
  } catch (e) {
    console.error('创建 MediaRecorder 失败', e)
    message.error('当前浏览器不支持视频录制')
    return
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data)
  }

  mediaRecorder.onerror = (e) => {
    console.error('MediaRecorder 出错', e)
    message.error('录制过程出错')
    stopRecordingAndExport()
  }

  // 3) 开始录制 + 开始播放
  mediaRecorder.start()
  isRecording.value = true
  isPlaying.value = true
  lastTimestamp = performance.now()
  playLoop()
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
  frameAccumulator = 0
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  evaluateTimeline(0)
}

// playLoop：requestAnimationFrame 播放主循环
//  - 使用 performance.now 计算帧间 deltaTime，与 playbackSpeed 相乘得播放推进量
//  - targetFps>0 时通过 frameAccumulator 限制评估频率（时间推进仍按真实 deltaTime，不丢进度）
//  - 到时间尾回到 0 秒（循环播放）
//  - 非VIP时：播放到FREE_DURATION时停止并提示
//  - 每帧调用 evaluateTimeline 重新计算场景状态
function playLoop() {
  if (!isPlaying.value) return

  const now = performance.now()
  const deltaTime = (now - lastTimestamp) / 1000
  lastTimestamp = now

  // targetFps > 0 时启用帧率控制：累积 deltaTime，达到目标帧间隔才推进评估
  if (targetFps.value > 0) {
    const frameInterval = 1 / targetFps.value
    frameAccumulator += deltaTime * playbackSpeed.value

    if (frameAccumulator >= frameInterval) {
      // 一次性消费掉整数倍的帧间隔，避免长时间后台切换后雪崩式更新
      const steps = Math.floor(frameAccumulator / frameInterval)
      const steppedTime = steps * frameInterval
      timelineState.currentTime += steppedTime
      frameAccumulator -= steppedTime
    } else {
      // 未达到目标帧间隔，直接请求下一帧，不做评估
      animationFrameId = requestAnimationFrame(playLoop)
      return
    }
  } else {
    // targetFps = 0：不限制，按显示器刷新率推进
    timelineState.currentTime += deltaTime * playbackSpeed.value
  }

  // 录制模式：到达最大可录制时长 → 自动停止录制并导出（不循环）
  if (isRecording.value && timelineState.currentTime >= editableMaxTime.value) {
    timelineState.currentTime = editableMaxTime.value
    evaluateTimeline(timelineState.currentTime)
    stopRecordingAndExport()
    return
  }

  // 非VIP限制：播放到免费时长时自动暂停并提示（录制模式下不触发，由上一条统一结束）
  if (!props.isVip && !isRecording.value && timelineState.currentTime >= FREE_DURATION) {
    timelineState.currentTime = FREE_DURATION
    evaluateTimeline(timelineState.currentTime)
    isPlaying.value = false
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    message.warning('升级VIP解锁更长时长播放功能')
    return
  }

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

  // 非VIP限制：播放头不能超过免费时长
  const maxTime = props.isVip ? effectiveDuration.value : Math.min(FREE_DURATION, effectiveDuration.value)
  timelineState.currentTime = snapTimeToFrame(Math.max(0, Math.min(time, maxTime)))
  evaluateTimeline(timelineState.currentTime)
}

function stopDragging() {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDragging)
}

async function evaluateTimeline(time: number) {
  console.log('evaluateTrack-a', 1)
  for (let i = 0; i < timelineState.timelineData.clips.length; i++) {
    const clip = timelineState.timelineData.clips[i]
    const data: any = {}
    const entity = window.worldApi.children.find(v => {
      return v.getOriginalData().id === clip.entityId
    })
    if (!entity) return;
    const inArea = time >= clip.startTime && time <= clip.endTime
    console.log('evaluateTrack-a', 2)
    if (inArea) {
      console.log('evaluateTrack-a', 3)
      // --- 情况1：命中某个 clip 区间 → 对每个轨道执行关键帧插值 ---
      for (let j = 0; j < clip.columns.length; j++) {
        const track = clip.columns[j]
        // console.log('evaluateTimeline', track, time)
        const { keyTimePoints, trackType } = track;
        if (keyTimePoints.length === 0) {
          return
        }
        const sortedKeyTimePoints = [...keyTimePoints].sort((a, b) => a.time - b.time)

        if (time < sortedKeyTimePoints[0].time) {
          // sortedKeyTimePoints 头部添加
          const valuePre: number | undefined | null = (entity.getOriginalData() as any)[trackType] as number;
          if (valuePre !== undefined && valuePre !== null) {
            sortedKeyTimePoints.unshift({
              type: 'point',
              time: clip.startTime,
              value: valuePre,
              easing: 'linear',
            })
          }
        }
        const value = await evaluateTrack(entity, trackType, sortedKeyTimePoints, time)
        if (value !== null) {
          data[trackType] = value;
        }
      }
      entity.setAnimationData({
        ...entity.getAnimationData(),
        ...data,
      });
    } else {
      // --- 情况2：time 在所有 clip 之前（还没开始第一个动画） ---
      const data: any = { ...entity.getOriginalData() };
      // console.log('clip.columns', clip, clip.columns)
      clip.columns.forEach(track => {
        if (time < track.keyTimePoints[0].time) {
          const { trackType } = track;
          const leftTime = 0;
          const rightTime = clip.startTime;
          const t = (time - leftTime) / (rightTime - leftTime)
          // @ts-ignore - trackType 为动态字符串，Entity 接口无法穷举
          const leftVal = entity.getOriginalData()[trackType] as any;
          const rightVal = track.keyTimePoints[0].value
          if (track.keyTimePoints[0].time === clip.startTime) {
            const previewVal = entity.editAnimationDataColumn(trackType, leftVal, rightVal, t)
            console.log('sss---1', trackType, previewVal)
            // @ts-ignore - trackType 为动态字符串，Entity 接口无法穷举
            data[trackType] = previewVal;// entity.getOriginalData()[trackType] as any;
          }
        } else {
          const last = track.keyTimePoints[track.keyTimePoints.length - 1];
          if (last.type === 'animation') {
            if (time > last.time + last.timeLength) {
              const { trackType } = track;
              const rightVal = last.value
              console.log('sss---2-1', trackType, rightVal)
              getPeopleAnimateOneTime(last, entity.meshList[0].children[0], last.time + last.timeLength)
            }
          } else {
            if (time > last.time) {
              const { trackType } = track;
              const rightVal = last.value
              console.log('sss---2-2', trackType, rightVal)
              data[trackType] = rightVal;
            }
          }
        }
      })
      console.log('sss---', data)
      entity.setAnimationData({
        ...entity.getAnimationData(),
        ...data,
      });
    }
  }

  // // 先尝试查找 time 落在哪些 clip 的 (startTime, endTime) 开区间内
  // const matchIndex = timelineState.timelineData.clips.findIndex(clip => {
  //   return time > clip.startTime && time < clip.endTime
  // })
  // const inArea = matchIndex !== -1;

  // if (!inArea) {
  //   if (timelineState.timelineData.clips.length > 0) {
  //     let match: ObjAllColumnData;
  //     // --- 情况2：time 在所有 clip 之前（还没开始第一个动画） ---
  //     if (time < timelineState.timelineData.clips[0].startTime) {
  //       match = timelineState.timelineData.clips[0];
  //       // console.log('ssss-3', match)
  //       if (match) {
  //         const entity = window.worldApi.children.find(v => {
  //           return v.getOriginalData().id === match.entityId
  //         })
  //         if (!entity) return;
  //         const data: any = { ...entity.getOriginalData() };
  //         match.columns.forEach(track => {
  //           const { trackType } = track;
  //           const leftTime = 0;
  //           const rightTime = match.startTime;
  //           const t = (time - leftTime) / (rightTime - leftTime)
  //           // @ts-ignore - trackType 为动态字符串，Entity 接口无法穷举
  //           const leftVal = entity.getOriginalData()[trackType] as any;
  //           const rightVal = track.keyTimePoints[0].value
  //           // 这里，应该有一个特例，就是角度angelY，比如从162到-154度。
  //           if (track.keyTimePoints[0].time === match.startTime) {
  //             const previewVal = leftVal + (rightVal - leftVal) * t;
  //             // @ts-ignore - trackType 为动态字符串，Entity 接口无法穷举
  //             data[trackType] = previewVal;// entity.getOriginalData()[trackType] as any;
  //           }
  //         })
  //         entity.setAnimationData({
  //           ...entity.getAnimationData(),
  //           ...data,
  //         });
  //       }
  //     } else {
  //       const data: any = {}
  //       // --- 情况3：time 在至少一个 clip 之后（取最近已结束 clip 的最终态） ---
  //       // reduce 遍历 clips：找出满足 endTime <= time 且 endTime 最大的 clip 索引（即「上一段已结束动画」）
  //       const matchPreIndex = timelineState.timelineData.clips.reduce((preIndex, clip, index) => {
  //         if (clip.endTime <= time) {
  //           if (preIndex === -1 || clip.endTime > timelineState.timelineData.clips[preIndex].endTime) {
  //             return index
  //           }
  //         }
  //         return preIndex
  //       }, -1)
  //       match = timelineState.timelineData.clips[matchPreIndex];
  //       if (match) {
  //         const entity = window.worldApi.children.find(v => {
  //           return v.getOriginalData().id === match.entityId
  //         })
  //         if (!entity) return;
  //         match.columns.forEach(track => {
  //           const { trackType, keyTimePoints } = track;
  //           // 每个轨道取最后一个 keyframe 的 value（动画结束的定格状态）；无 keyTimePoints 跳过
  //           if (keyTimePoints.length > 0) {
  //             const lastValue = keyTimePoints[keyTimePoints.length - 1].value;
  //             data[trackType] = lastValue;
  //           }
  //         })
  //         entity.setAnimationData({
  //           ...entity.getAnimationData(),
  //           ...data,
  //         });
  //       }
  //     }
  //   }
  // } else if (inArea) {
  // }
}

function showBuyVip() {
  emits('showBuyVip')
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
        min-width: 32px;
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

        // 录制中状态：红色 + 脉冲动画
        &.recording {
          background: #e74c3c;
          animation: recordingPulse 1s ease-in-out infinite;

          &:hover {
            background: #c0392b;
          }
        }

        // 转码中状态：紫色 + 不允许点击
        &.converting,
        &:disabled {
          background: #8e44ad;
          cursor: not-allowed;
          opacity: 0.85;
          pointer-events: none;
        }
      }

      @keyframes recordingPulse {

        0%,
        100% {
          box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.5);
        }

        50% {
          box-shadow: 0 0 0 6px rgba(231, 76, 60, 0);
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

      // === 第一层：轨道内容层（承载所有 timeline-row + track-item + keyTimePoints） ===
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
          margin-left: -1px;
          height: 100%;
          background: rgba(233, 69, 96, 0.6);
          cursor: ew-resize; // 左右箭头光标，提示可拖拽
          pointer-events: auto; // 单独开启事件（覆盖父级的 none）
          box-shadow: 0 0 6px rgba(233, 69, 96, 0.3);
        }
      }

      .timeline-content-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;

        // timeline-track-area：所有 timeline-row 的父容器
        .timeline-track-area {
          padding-top: 8px;
          padding-bottom: 8px;
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
            height: 50px;
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
              height: 50px;
              top: 0;
              background: rgba(15, 52, 96, 0.4); // 深蓝半透明背景
              transition: box-shadow 0.15s;

              &:hover {
                box-shadow: 0 0 0 1px rgba(233, 69, 96, 0.5); // 悬浮红色描边高亮
              }

              // active：当前打开了浮动编辑面板的 clip，更亮的红色边框 + 更高 z-index
              &.active {
                box-shadow: inset 0 0 0 1px #e94560;
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

              // locked：非VIP时10秒以后的clip，灰色禁用样式
              &.locked {
                border-color: #666;
                background: rgba(100, 100, 100, 0.3);
                cursor: not-allowed;
                opacity: 0.7;
                filter: grayscale(0.5);

                &:hover {
                  box-shadow: none; // 锁定状态下无hover高亮
                }

                .track-header-bar {

                  .clip-name,
                  .clip-duration {
                    color: #888;
                  }
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

              // locked-badge：非VIP未解锁徽章（🔒）
              .locked-badge {
                position: absolute;
                top: -8px;
                left: -6px;
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, #9c27b0, #673ab7);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
                z-index: 10;

                .locked-icon {
                  font-size: 10px;
                  line-height: 1;
                }
              }

              // track-header-bar：track-item 内部紧凑信息行（对象名 + 时间范围），高度 35px 居中
              .track-header-bar {
                display: flex;
                align-items: center;
                height: 20px;
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
                  white-space: nowrap;
                }
              }

              .keyframe-node {
                position: absolute;
                top: 30px;
                min-width: 16px;
                height: 16px;
                transform: translateX(-8px);
                margin-top: -6px;
                border-radius: 8px;
                background: #4CAF50;
                border: 2px solid #fff;
                box-sizing: border-box;
                transition: transform 0.15s, background 0.15s;
                z-index: 2;

                &:hover {
                  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.4);
                  transform: translateX(-8px); // 悬浮放大方便点击
                }

                // selected 选中态：红色背景 + 更大比例 + 红色外发光
                &.selected {
                  background: #e94560;
                  transform: translateX(-8px);
                  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.4);
                }
              }
            }
          }
        }

        // vip-divider：VIP分界线，在10秒位置显示竖线+标签（与timeline-track-area平级）
        .vip-divider {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          z-index: 102;
          pointer-events: none;

          .vip-divider-line {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            background: linear-gradient(to bottom, #ffd700, #ff9800, #ffd700);
            box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
          }

          .vip-divider-label {
            position: absolute;
            top: 2px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ffd700, #ff9800);
            color: #fff;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 3px;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(255, 152, 0, 0.4);
            z-index: 61;

            .vip-icon {
              font-size: 11px;
            }
          }
        }

        .locked-overlay {
          position: absolute;
          top: 0;
          bottom: 0;
          z-index: 101;

          .locked-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(45deg,
                rgba(80, 80, 80, 0.15),
                rgba(80, 80, 80, 0.15) 10px,
                rgba(60, 60, 60, 0.15) 10px,
                rgba(60, 60, 60, 0.15) 20px);
            backdrop-filter: blur(1px);
          }

          .locked-text {
            position: absolute;
            top: 50%;
            left: 130px;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: #888;
            white-space: nowrap;

            .locked-big-icon {
              font-size: 32px;
              opacity: 0.6;
            }

            .locked-message {
              font-size: 12px;
              font-weight: 500;
              color: #aaa;
              background: rgba(40, 40, 40, 0.8);
              padding: 4px 12px;
              border-radius: 12px;
              backdrop-filter: blur(4px);
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
    border-bottom: 1px solid #0f3460;

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
        background: rgba(0, 0, 0, 0.7);

        // major：整数秒主刻度（更清晰的 40% 背景 + 左下角标签）
        &.major {
          height: 100%;
          background: rgba(0, 0, 0, 0.7);

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

    // ruler-vip-marker：标尺上的VIP标记（在10秒位置显示皇冠图标）
    .ruler-vip-marker {
      position: absolute;
      top: 0;
      height: 100%;
      width: 24px;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 10;

      .ruler-vip-icon {
        font-size: 14px;
        filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.8));
        animation: vip-glow 2s ease-in-out infinite;
      }
    }
  }
}

// vip-glow：VIP标记的发光动画
@keyframes vip-glow {

  0%,
  100% {
    filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.6));
  }

  50% {
    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 1));
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
  background-color: white;

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
    flex-direction: row;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
    box-sizing: border-box;
    white-space: nowrap;
    height: 36px;

    // 最后一行不加分隔线
    &:last-child {
      border-bottom: none;
    }

    // 轨道类型标签（position / rotation / opacity ...），固定宽度 70px
    .track-label {
      font-size: 11px;
      color: #a8b2d1;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-left: 4px;
      box-sizing: border-box;
    }

    // ✕ 移除轨道按钮：默认透明，hover track-label 时出现
    .track-remove {
      background: none;
      border: none;
      color: #a8b2d1;
      cursor: pointer;
      font-size: 10px;
      width: 14px;
      height: 14px;
      padding: 0;
      line-height: 1;
      transition: opacity 0.15s, color 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding-left: 3px;
      box-sizing: border-box;

      .button {
        border: solid 1px white;
        color: #a8b2d1;
        width: 22px;
        height: 22px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;

        &:hover {
          border: solid 1px #a8b2d1;
        }
      }

      &:hover {
        color: #f56c6c; // 红色提醒「删除」语义
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

      // curve-line：SVG polyline 插值曲线预览（opacity / visible / position Y 等映射）
      .curve-line {
        position: absolute;
        top: 15px;
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
