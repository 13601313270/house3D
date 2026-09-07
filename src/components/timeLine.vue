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
        <div class="control-btn" @click="stop">⏹</div>
        <div class="control-btn" @click="togglePlay">{{ isPlaying ? '⏸' : '▶' }}</div>
        <div class="control-btn" :class="{ recording: isRecording }" @click="recordVideoPlay">
          <span class="rec-icon" :class="isRecording ? 'stop' : 'record'"></span>{{ isRecording ? '停止' : '录制' }}
        </div>
        <input type="range" class="speed-control" v-model="playbackSpeed" min="0.1" max="3" step="0.1" />
        <span class="speed-label">{{ playbackSpeed }}倍速</span>
        <div class="control-btn" @click="zoomIn">+</div>
        <div class="control-btn" @click="zoomOut">−</div>
        <span class="speed-label">{{ Math.round(zoomLevel * 100) }}%</span>
      </div>
    </div>

    <div class="timeline-ruler-leftPanel">对象</div>
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
      </div>
    </div>

    <!-- 滚动容器：控制轨道区域横向与纵向滚动，onScroll 同步 scrollLeft 状态 -->
    <div class="timeline-scroll-container">
      <div class="left" id="timeLeft" @scroll="onScrollLeft">
        <div class="timeline-content">
          <div class="timeline-track-area">
            <div v-for="(segment, rowIndex) in rowsByIndex" :key="`time-row-${rowIndex}`" class="timeline-row">
              <div class="track-header-bar">
                <div class="headTool">

                </div>
                <img class="typeImg" v-if="segment.typeImg" :src="segment.typeImg" alt="">
                <span class="clip-name">{{ segment.typeName }}</span>
                <img class="location" src="@/assets/location.svg" @click.stop.prevent="findObjInMap(segment)" />
              </div>
              <div :key="segment.clip.clipId" class="track-item">
                <div v-for="item in segment.clip.columns" class="keyframe-node">
                  {{ getName(segment.clip.entityId, item.trackType) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- timeInfo：使用 CSS Grid 叠加两层（timeline-content-wrapper + playhead-container），使播放头贯穿整个区域 -->
      <div class="timeInfo" id="timeInfo" @contextmenu.stop.prevent :style="{ paddingLeft: (moreLeft + 4) + 'px' }"
        @mousedown="handleTimeInfoMouseDown" @scroll="onScroll">
        <div class="timeline-content-wrapper" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
          <div class="timeline-track-area">
            <div v-for="(segment, rowIndex) in rowsByIndex" :key="`time-row-${rowIndex}`" class="timeline-row">
              <div class="head">
              </div>
              <div :key="segment.clip.clipId" class="track-item" :class="{
                active: activeClipId === segment.clip.clipId,
                locked: !props.isVip && segment.startTime >= FREE_DURATION
              }" @contextmenu.stop.prevent="toggleClipContent($event, segment)">
                <div v-for="item in segment.clip.columns" class="keyframe-nodeLine">
                  <div class="lineBetweenPoint" v-if="item.keyTimePoints.length >= 2"
                    :style="keyPointLineStyleNew(item, segment)">
                  </div>
                  <div class="keyframe-node">
                    <div v-for="keyTimePoint in item.keyTimePoints" class="keyframe-node2"
                      :class="{ range: keyTimePoint.type === 'animation' }"
                      :style="keyFrameStyleNew2(keyTimePoint, segment)" @click="clickKeyframePoint(keyTimePoint)"
                      @mousedown.stop.prevent="startKeyframeDrag($event, segment, item, keyTimePoint, 'move')"
                      @contextmenu.prevent.stop="toggleClipContentFrame($event, segment, keyTimePoint)">
                      <template v-if="keyTimePoint.type === 'animation' && keyTimePoint.timeLength > 0">
                        <div class="keyframe-handle handle-left"
                          @mousedown.stop.prevent="startKeyframeDrag($event, segment, item, keyTimePoint, 'trim-start')">
                        </div>
                        <div class="keyframe-handle handle-right"
                          @mousedown.stop.prevent="startKeyframeDrag($event, segment, item, keyTimePoint, 'trim-end')">
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- VIP分界线：非VIP时在10秒位置显示（与timeline-track-area平级） -->
          <div v-if="showLockedArea" class="vip-divider"
            :style="{ left: `${(FREE_DURATION / effectiveDuration) * 100}%` }">
            <div class="vip-divider-line"></div>
            <!-- <div class="vip-divider-label">
              <span class="vip-icon">👑</span>
              <span>VIP解锁</span>
            </div> -->
          </div>
          <!-- 未解锁遮罩层：非VIP时10秒以后的区域（与timeline-track-area平级） -->
          <div v-if="showLockedArea" class="locked-overlay"
            :style="{ left: `${(FREE_DURATION / effectiveDuration) * 100}%`, width: `${((effectiveDuration - FREE_DURATION) / effectiveDuration) * 100}%` }">
            <div class="locked-pattern"></div>
            <div class="locked-text" @click="showBuyVip">
              <span class="locked-big-icon">
                <img src="@/assets/lock.svg" />
              </span>
              <span class="locked-message">升级VIP解锁更长时长</span>
            </div>
          </div>
        </div>

        <!-- 播放头容器层：与 timeline-content-wrapper 同区域但 z-index 更高（pointer-events:none），
             仅 playhead-line 自身响应 mousedown 进行拖拽定位 -->
        <div class="playhead-container" :style="{ width: `${effectiveDuration * zoomLevel * 50}px` }">
          <div class="playhead-line" :style="{ left: `${(currentTime / effectiveDuration) * 100}%` }"></div>
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
import { ObjAllColumnData, timelineState, KeyTimePoint, ObjOneColumnData } from '@/utils/timelineManage';
import editItem from '@/utils/editItem';
import DataTypeEditPanel from '../views/DataTypeEditPanel.vue'
import showContextMenu from '@/utils/contextMenu';
import evaluateTrack from '@/utils/evaluateTrack';
import getPeopleAnimateOneTime from '@/utils/getPeopleAnimateOneTime';
import { handleLocation, Item } from '@/utils/handleLocation';
import { allPluginByKey } from '@/entities/index';

interface ClipSegment {
  clip: ObjAllColumnData
  typeName: string,
  type: string,
  startTime: number
  typeImg: string,
  endTime: number
}
const props = defineProps<{
  isVip: boolean
}>()
const effectiveDuration = ref<number>(0)
const rulerMarks = ref<{
  time: number;
  major: boolean;
}[]>([])
// const clipSegments = ref<ClipSegment[]>([])
const moreLeft = 170;
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

    const rows: ClipSegment[] = []
    for (let i = 0; i < timelineState.timelineData.clips.length; i++) {
      const clip = timelineState.timelineData.clips[i]
      // console.log('clip=====', clip)
      const entity = window.worldApi.children.find(vv => {
        return vv.getOriginalData().id === clip.entityId
      })
      const plugin = allPluginByKey[entity?.type || '']
      // console.log('plugin=====', plugin?.previewImg)
      rows.push({
        clip,
        type: entity?.type || '',
        typeName: entity?.name || '',
        typeImg: plugin?.previewImg || '',
        startTime: clip.startTime,
        endTime: clip.endTime,
      })
    }
    rowsByIndex.value = rows
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
const scrollTop = ref(0)                      // 当前纵向滚动位置
const collapsedClips = ref<Set<string>>(new Set()) // 折叠的对象轨道集合（预留）
const activeClipId = ref<string | null>(null) // 当前展开浮动面板的 clipId
const activeSegment = ref<ClipSegment | null>(null) // 当前展开浮动面板的 segment（含 startTime/endTime/rowIndex）
const isShowTrackDropdown = ref(false)        // 「添加属性」下拉菜单是否展开

// ========== 非响应式临时状态（拖拽等） ==========
let animationFrameId: number | null = null   // requestAnimationFrame id，用于播放循环
let lastTimestamp = 0                        // 上一帧时间戳，计算 deltaTime
let frameAccumulator = 0                     // 帧率控制累积器（秒），targetFps>0 时生效
let isScrubbing = false                       // 空白区域按下拖动（scrub）播放头标志
let scrubClosedPanel = false                  // scrub 时是否关闭了浮动面板（用于 click 后续逻辑）
let isKeyframeDragging = false               // keyframe-node（关键帧节点）拖拽中标志
let keyframeDragMoved = false                // 本次按下后是否真正发生了拖拽（用于抑制随后的 click）
let keyframeDragStartX = 0                   // 拖拽起始鼠标 X 坐标
let keyframeDragOriginTime = 0               // 拖拽起始的关键帧时间（秒）
let keyframeDragMode: 'move' | 'trim-start' | 'trim-end' = 'move' // 拖拽模式：整体移动 / 左句柄调起点 / 右句柄调时长
let keyframeDragOriginEnd = 0                // 拖拽起始时动画区间的结束时间（time + timeLength）
let keyframeDragOriginEnds: number[] = []    // 每个被拖拽动画点的原始结束时间（trim-start 时锚定终点不动）
let keyframeDragSegment: ClipSegment | null = null  // 拖拽的关键帧所属 segment
let keyframeDragPoints: KeyTimePoint[] = []  // 本次拖拽要移动的关键帧点（同一时刻跨轨道共享的所有点）

// ========== 录制相关状态 ==========
let mediaRecorder: MediaRecorder | null = null  // MediaRecorder 实例
let recordedChunks: Blob[] = []                 // 录制数据块缓存

const rowsByIndex = ref<ClipSegment[]>([])

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

function handleTimeInfoMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.closest('.track-timeline') || target.closest('.track-header') || target.closest('.playhead-line')) {
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
  scrollLeft.value = target.scrollLeft
  scrollTop.value = target.scrollTop
  console.log(1)
  if (document.getElementById('timeLeft')) {
    (document.getElementById('timeLeft') as any).scrollTop = scrollTop.value;
  }
}
function onScrollLeft(event: Event) {
  const target = event.target as HTMLElement
  if (document.getElementById('timeInfo')) {
    console.log(2);
    (document.getElementById('timeInfo') as any).scrollTop = target.scrollTop;
  }
}

// toggleClipContent：track-item 点击时，切换浮动面板显示/隐藏
// 点击同一个 clip 的 track-item → 关闭；点击不同 clip → 先关闭再打开
// 打开面板时：暂停播放（正在播放时），并根据 track-item DOM 位置计算面板 left/top/width
// 非VIP限制：不能编辑10秒以后的clip
function toggleClipContent(event: MouseEvent, segment: ClipSegment) {
  // 暂时关闭
  // // 非VIP限制：禁止打开10秒以后的clip编辑面板
  // if (!props.isVip && segment.startTime >= FREE_DURATION) {
  //   message.warning('升级VIP解锁更长时长编辑功能')
  //   return
  // }

  // if (activeClipId.value === segment.clip.clipId) {
  //   closeClipContent()
  //   return
  // }

  // if (isPlaying.value) {
  //   togglePlay()
  // }

  // showContextMenu(event, [
  //   {
  //     title: '删除动画',
  //     icon: '🗑',
  //     danger: true,
  //     callback: () => deleteClip(segment.clip.clipId),
  //   },
  // ])
}

function keyPointLineStyleNew(item: ObjOneColumnData, segment: ClipSegment) {
  const width = (item.keyTimePoints[item.keyTimePoints.length - 1].time - item.keyTimePoints[0].time) / (effectiveDuration.value || 1)
  return {
    left: `${((item.keyTimePoints[0].time) / effectiveDuration.value) * 100}%`,
    width: `${width * 100}%`,
  }
}
function keyFrameStyleNew2(startTime: KeyTimePoint, segment: ClipSegment) {
  const left = `${((startTime.time) / effectiveDuration.value) * 100}%`;
  if (startTime.type === 'animation') {
    const width = `${startTime.timeLength / effectiveDuration.value * 100}%`;
    return {
      left,
      width
    }
  } else {
    return {
      left,
    }
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

function toggleClipContentFrame(event: MouseEvent, segment: ClipSegment, keyTimePoint: KeyTimePoint) {
  const time = keyTimePoint.time
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
              track.keyTimePoints = track.keyTimePoints.filter(k => k !== keyTimePoint)
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
// 5) 设置 selectedKeyframe（用于样式高亮红色选中态）
function onKeyframeClick(time: number) {
  // 若刚结束一次关键帧拖拽 → 本次 click 不生效（避免拖拽后播放头被重置/暂停逻辑重复触发）
  if (keyframeDragMoved) {
    keyframeDragMoved = false
    return
  }
  // 播放中操作关键帧 → 自动暂停，避免播放与编辑冲突
  if (isPlaying.value) {
    togglePlay()
  }
  timelineState.currentTime = snapTimeToFrame(time);
  evaluateTimeline(timelineState.currentTime)
}

// 关键帧节点拖拽
//  三种模式（mode）：
//   - 'move'       ：拖动节点整体，改 item.time（timeLength 不变），同时刻跨轨道的所有点一起移动
//   - 'trim-start' ：左句柄，改 item.time，动画区间终点锚定不动（timeLength 随动）
//   - 'trim-end'   ：右句柄，改 item.timeLength（起点 time 锚定不动）
//  - trim 模式只作用于 animation 类型点（range 宽度来自动画时长）；普通 point 点不受句柄影响
//  - 时间对齐到帧网格（snapTimeToFrame），拖拽允许超出所属 clip 范围（仅限制在时间轴 [0, effectiveDuration] 内）
//  - 鼠标松开时无论是否超出范围，都按 clip 内全部关键帧重新计算边界：最左关键帧 = startTime，最右（含动画时长）= endTime
//  - 拖拽过程中播放头跟随，实时 evaluateTimeline 预览场景效果
function startKeyframeDrag(
  event: MouseEvent,
  segment: ClipSegment,
  column: ObjOneColumnData,
  keypoint: KeyTimePoint,
  mode: 'move' | 'trim-start' | 'trim-end' = 'move'
) {
  const time = keypoint.time
  keyframeDragMoved = false
  keyframeDragMode = mode
  keyframeDragStartX = event.clientX
  keyframeDragOriginTime = time
  keyframeDragSegment = segment
  keyframeDragPoints = []
  keyframeDragOriginEnds = [];

  (() => {
    if (keypoint.time !== time) return
    // move 模式收集同时刻所有点；trim 模式只收集动画段点（句柄属于 range）
    if (mode === 'move' || keypoint.type === 'animation') {
      keyframeDragPoints.push(keypoint)
      // 把x和y绑定起来
      if (column.trackType === 'x') {
        const ySegment = segment.clip.columns.find(track => track.trackType === 'y')
        if (ySegment) {
          const yKeyPoint = ySegment.keyTimePoints.find(kf => kf.time === time)
          if (yKeyPoint) {
            keyframeDragPoints.push(yKeyPoint)
          }
        }
      }
      if (column.trackType === 'y') {
        const xSegment = segment.clip.columns.find(track => track.trackType === 'x')
        if (xSegment) {
          const xKeyPoint = xSegment.keyTimePoints.find(kf => kf.time === time)
          if (xKeyPoint) {
            keyframeDragPoints.push(xKeyPoint)
          }
        }
      }
      // hack专门为摄像机的target坐标准备
      if (column.trackType === 'targetPositionX') {
        const targetPositionYSegment = segment.clip.columns.find(track => track.trackType === 'targetPositionY')
        if (targetPositionYSegment) {
          const targetPositionYKeyPoint = targetPositionYSegment.keyTimePoints.find(kf => kf.time === time)
          if (targetPositionYKeyPoint) {
            keyframeDragPoints.push(targetPositionYKeyPoint)
          }
        }
      }
      if (column.trackType === 'targetPositionY') {
        const targetPositionXSegment = segment.clip.columns.find(track => track.trackType === 'targetPositionX')
        if (targetPositionXSegment) {
          const targetPositionXKeyPoint = targetPositionXSegment.keyTimePoints.find(kf => kf.time === time)
          if (targetPositionXKeyPoint) {
            keyframeDragPoints.push(targetPositionXKeyPoint)
          }
        }
      }
      keyframeDragOriginEnds.push(keypoint.type === 'animation' ? keypoint.time + keypoint.timeLength : keypoint.time)
    }
  })();

  // segment.clip.columns.forEach(track => {
  //   track.keyTimePoints.forEach(kf => {
  //     if (kf.time !== time) return
  //     // move 模式收集同时刻所有点；trim 模式只收集动画段点（句柄属于 range）
  //     if (mode === 'move' || kf.type === 'animation') {
  //       keyframeDragPoints.push(kf)
  //       keyframeDragOriginEnds.push(kf.type === 'animation' ? kf.time + kf.timeLength : kf.time)
  //     }
  //   })
  // })
  if (keyframeDragPoints.length === 0) return
  keyframeDragOriginEnd = Math.max(...keyframeDragOriginEnds)
  isKeyframeDragging = true
  document.addEventListener('mousemove', onKeyframeDrag)
  document.addEventListener('mouseup', stopKeyframeDrag)
}

function onKeyframeDrag(event: MouseEvent) {
  if (!isKeyframeDragging || !keyframeDragSegment) return
  // 3px 阈值内不算拖拽，避免轻微抖动误触
  if (!keyframeDragMoved && Math.abs(event.clientX - keyframeDragStartX) < 3) return
  if (!keyframeDragMoved) {
    keyframeDragMoved = true
    // 拖拽中操作关键帧 → 自动暂停，避免播放推进与拖拽冲突
    if (isPlaying.value) {
      togglePlay()
    }
  }
  const wrapper = document.querySelector('.timeline-content-wrapper') as HTMLElement
  if (!wrapper) return

  const rect = wrapper.getBoundingClientRect()
  // 鼠标位移换算为时间增量（wrapper 宽度对应 effectiveDuration 秒）
  const deltaTime = ((event.clientX - keyframeDragStartX) / rect.width) * effectiveDuration.value
  // 动画段最小时长：对齐一帧（避免拖成 0 或负值）
  const minLen = targetFps.value > 0 ? 1 / targetFps.value : 0.05
  // 允许拖出 clip 范围，仅限制在时间轴 [0, effectiveDuration] 内；松开后由 stopKeyframeDrag 按关键帧重算 clip 边界
  let previewTime = keyframeDragOriginTime

  if (keyframeDragMode === 'move') {
    const newTime = snapTimeToFrame(Math.max(0, Math.min(keyframeDragOriginTime + deltaTime, effectiveDuration.value)))
    keyframeDragPoints.forEach(kf => {
      kf.time = newTime
    })
    previewTime = newTime
  } else if (keyframeDragMode === 'trim-start') {
    // 终点锚定不动，拖动起点：newTime 上限为终点 - minLen
    const newTime = snapTimeToFrame(Math.max(0, Math.min(keyframeDragOriginTime + deltaTime, keyframeDragOriginEnd - minLen)))
    keyframeDragPoints.forEach((kf, i) => {
      if (kf.type === 'animation') {
        kf.time = newTime
        kf.timeLength = Math.max(0, keyframeDragOriginEnds[i] - newTime)
      }
    })
    previewTime = newTime
  } else {
    // trim-end：起点锚定不动，拖动终点改 timeLength：newEnd 下限为起点 + minLen
    const newEnd = snapTimeToFrame(Math.max(keyframeDragOriginTime + minLen, Math.min(keyframeDragOriginEnd + deltaTime, effectiveDuration.value)))
    keyframeDragPoints.forEach(kf => {
      if (kf.type === 'animation') {
        kf.timeLength = Math.max(0, newEnd - kf.time)
      }
    })
    previewTime = newEnd
  }

  // timelineData 非响应式，通过 triggerChange 触发 updateRef 重新渲染节点位置/宽度
  timelineState.triggerChange()
  // 播放头跟随被拖拽的边，实时预览
  timelineState.currentTime = previewTime
  evaluateTimeline(previewTime)
}

function stopKeyframeDrag() {
  // 任何拖拽结束后都重新计算 clip 边界：
  // 最左侧关键帧的时间 = clip.startTime；最右侧（动画段含 timeLength）= clip.endTime
  // 因此 clip 边界既会随关键帧外拖而扩大，也会随关键帧内拖而收缩
  if (isKeyframeDragging && keyframeDragMoved && keyframeDragSegment) {
    const clip = keyframeDragSegment.clip
    let newStart = Infinity
    let newEnd = -Infinity
    clip.columns.forEach(track => {
      track.keyTimePoints.forEach(kf => {
        newStart = Math.min(newStart, kf.time)
        newEnd = Math.max(newEnd, kf.type === 'animation' ? kf.time + kf.timeLength : kf.time)
      })
    })
    if (newEnd >= 0) {
      newStart = Math.max(0, newStart)
      if (newStart !== clip.startTime || newEnd !== clip.endTime) {
        clip.startTime = newStart
        clip.endTime = newEnd
        timelineState.triggerChange()
        // 以重算后的区间重新评估当前播放头位置
        evaluateTimeline(timelineState.currentTime)
      }
    }
  }
  isKeyframeDragging = false
  keyframeDragSegment = null
  keyframeDragPoints = []
  keyframeDragOriginEnds = []
  document.removeEventListener('mousemove', onKeyframeDrag)
  document.removeEventListener('mouseup', stopKeyframeDrag)
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

async function evaluateTimeline(time: number) {
  for (let i = 0; i < timelineState.timelineData.clips.length; i++) {
    const clip = timelineState.timelineData.clips[i]
    const data: any = {}
    const entity = window.worldApi.children.find(v => {
      return v.getOriginalData().id === clip.entityId
    })
    if (!entity) return;
    const inArea = time >= clip.startTime && time <= clip.endTime
    if (inArea) {
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
      for (let j = 0; j < clip.columns.length; j++) {
        const track = clip.columns[j]
        if (time < track.keyTimePoints[0].time) {
          const { trackType } = track;
          const leftTime = 0;
          const rightTime = clip.startTime;
          const t = (time - leftTime) / (rightTime - leftTime)
          // @ts-ignore - trackType 为动态字符串，Entity 接口无法穷举
          const leftVal = entity.getOriginalData()[trackType] as any;
          let rightVal: any = track.keyTimePoints[0].value
          if (track.keyTimePoints[0].type === 'animation') {
            rightVal = await getPeopleAnimateOneTime(track.keyTimePoints[0], entity, track.keyTimePoints[0].time);
          }
          if (track.keyTimePoints[0].time === clip.startTime) {
            const previewVal = entity.editAnimationDataColumn(trackType, leftVal, rightVal, t)
            // console.log('sss---1', trackType, previewVal)
            // @ts-ignore - trackType 为动态字符串，Entity 接口无法穷举
            data[trackType] = previewVal;// entity.getOriginalData()[trackType] as any;
          }
          // console.log('evaluateTrack===2', trackType, data[trackType])
        } else {
          const last = track.keyTimePoints[track.keyTimePoints.length - 1];
          if (last.type === 'animation') {
            if (time > last.time + last.timeLength) {
              const { trackType } = track;
              const boneData = await getPeopleAnimateOneTime(last, entity, last.time + last.timeLength)
              data[trackType] = boneData;
            }
          } else {
            if (time > last.time) {
              const { trackType } = track;
              const rightVal = last.value
              data[trackType] = rightVal;
            }
          }
        }
      }
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
function findObjInMap(item: ClipSegment) {
  const { entityId } = item.clip
  console.log('item', entityId)
  const entity = window.worldApi.children.find(v => {
    return v.getOriginalData().id === entityId
  })
  if (!entity) return;
  handleLocation(window.worldApi, entityId)
}
function clickKeyframePoint(keyTimePoint: KeyTimePoint) {
  console.log(11, keyTimePoint.time)
  timelineState.currentTime = snapTimeToFrame(keyTimePoint.time);
  evaluateTimeline(keyTimePoint.time)
}

function getName(entityId: string, type: string) {
  const entity = window.worldApi.children.find(vv => {
    return vv.getOriginalData().id === entityId
  })
  if (entity) {
    const meta = entity.getDataMeta();
    const name: string = meta[type]
    if (name) return name
  }
  return type
}

// onUnmounted：组件卸载时清理动画帧与事件监听，避免内存泄漏
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  document.removeEventListener('mousemove', onKeyframeDrag)
  document.removeEventListener('mouseup', stopKeyframeDrag)
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
  font-family: Inter, "Noto Sans SC", sans-serif;
  position: relative;

  // 头部控制栏：左侧标题+当前时间，右侧停止/播放/倍速滑块/缩放按钮
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    border-bottom: 1px solid rgb(209, 209, 206); // 与标尺区域的分隔线
    background: rgb(247, 247, 245);

    // 左侧区域：标题 + 当前时间 / 总时长
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .title {
        font-size: 16px;
        color: black; // 品牌红色标题
      }

      // 时间显示：等宽字体，数字对齐不跳动
      .time-display {
        font-size: 14px;
        color: #a8b2d1;
      }
    }

    // 右侧区域：停止 ▶⏸ 倍速 缩放
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;

      // 通用方形控制按钮（停止 / 播放 / 缩放加减）
      .control-btn {
        height: 32px;
        padding: 0 10px;
        box-sizing: border-box;
        border-radius: 3px;
        background: rgb(255, 255, 255);
        border: 1px solid rgb(232, 232, 229);
        color: rgb(23, 24, 26);
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: #1a4d7a; // 悬浮时稍亮的蓝色
        }

        // 录制按钮图标：录制时红色小圆圈，停止时红色方块
        .rec-icon {
          display: inline-block;
          width: 9px;
          height: 9px;
          margin-right: 5px;
          vertical-align: middle;
          background: rgb(239, 68, 68);

          &.record {
            border-radius: 50%; // 圆形
          }
        }

        // 录制中状态：保留脉冲动画，背景保持白色以突出红色方块图标
        &.recording {
          animation: recordingPulse 1s ease-in-out infinite;
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
        appearance: none;
        -webkit-appearance: none;
        background: rgb(99, 91, 255);
        border-radius: 3px;
        outline: none;

        // 滑块圆点
        &::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(99, 91, 255);
          // border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }

        &::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgb(99, 91, 255);
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }

        &::-moz-range-track {
          height: 6px;
          background: rgb(99, 91, 255);
          border-radius: 3px;
        }
      }

      // 倍速 / 缩放百分比标签
      .speed-label {
        min-width: 42px;
        font-size: 12px;
        color: #a8b2d1;
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

    .left {
      width: 173px; // 比174小了1像素，避免与时间滚动条重叠
      flex-shrink: 0;
      position: absolute;
      background: #ffffff;
      border-right: 1px solid rgb(232, 232, 229);
      height: 100%;
      overflow: auto;
      z-index: 103;
      scrollbar-width: none;

      /* Firefox 隐藏滚动条 */
      /* 隐藏滚动条 */
      &::-webkit-scrollbar {
        width: 0;
        height: 0;
      }

      .timeline-content {
        position: relative;
        display: flex;
        flex-direction: column;

        .timeline-track-area {
          padding-bottom: 32px;
          overflow-y: auto;
          overflow-x: hidden;
          box-sizing: border-box;
          position: relative;

          .timeline-row {
            position: relative;
            border-bottom: 2px solid #e8e8e5;
            display: flex;
            flex-direction: column;

            .track-header-bar {
              display: flex;
              align-items: center;
              width: 100%;
              height: 34px;
              gap: 5px;
              overflow: hidden;
              flex-direction: row;
              flex-shrink: 0;
              position: relative;
              background-color: #eeeeea;
              border-bottom: 1px solid rgb(232, 232, 229);

              .clip-name {
                font-size: 15px;
                line-height: 20px;
                color: #000000;
                font-weight: bold;
              }

              .location {
                width: 20px;
                height: 20px;
              }

              .typeImg {
                width: 18px;
                height: 18px;
              }
            }

            .track-item {
              position: relative;
              overflow: visible;
              box-sizing: border-box;
              min-width: 20px;
              z-index: 5;
              top: 0;
              transition: box-shadow 0.15s;
              flex-grow: 1;
              border-left: 1px solid rgba(105, 68, 68, 0.35);
              margin-bottom: -1px;

              .keyframe-node {
                min-width: 16px;
                height: 22px;
                position: relative;
                border-bottom: 1px solid rgb(232, 232, 229);
                transition: transform 0.15s, background 0.15s;
                z-index: 2;
                font-size: 14px;
                line-height: 22px;
                text-align: left;
                padding-left: 8px;
              }
            }
          }
        }
      }

    }

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
          pointer-events: none;
          box-shadow: 0 0 6px rgba(233, 69, 96, 0.3);
        }
      }

      .timeline-content-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;

        .timeline-track-area {
          padding-bottom: 32px;
          overflow-y: auto;
          box-sizing: border-box;
          position: relative;

          .head {
            height: 34px;
            background-color: #eeeeea;
            border-bottom: 1px solid rgb(232, 232, 229);
          }

          .timeline-row {
            position: relative;
            border-bottom: 2px solid #e8e8e5;

            // track-item：单个 clip 的视觉表示，绝对定位 left / width 按百分比占 timeline-row
            .track-item {
              position: relative;
              overflow: visible; // warning-badge 要溢出右上角
              box-sizing: border-box; // 包含 border/padding 入宽度，与 track-item 计算宽度一致
              min-width: 20px; // 极端缩放下仍能点击
              z-index: 5;
              top: 0;
              transition: box-shadow 0.15s;
              margin-bottom: -1px;

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

              .keyframe-nodeLine {
                border-bottom: 1px solid rgb(232, 232, 229);
                height: 22px;
                position: relative;

                .lineBetweenPoint {
                  position: absolute;
                  left: 0;
                  top: 0;
                  background: black;
                  height: 2px;
                  top: 8px;
                  background: rgba(99, 91, 255, 0.48);
                  z-index: 0;
                }

                .keyframe-node {
                  position: absolute;
                  left: 0;
                  top: 0;
                  min-width: 16px;
                  position: relative;
                  background: #635cff38;
                  box-sizing: border-box;
                  transition: transform 0.15s, background 0.15s;
                  z-index: 2;

                  // keyframe-handle：range 节点左右两侧的边界调整句柄
                  // 默认半透明可见（不依赖父级 hover），hover 时提亮；pointer-events 默认 auto 可命中
                  .keyframe-handle {
                    position: absolute;
                    top: 0;
                    height: 100%;
                    width: 6px;
                    z-index: 3;
                    background: rgba(255, 255, 255, 0.35);
                    transition: background 0.15s;

                    &.handle-left {
                      left: 0;
                      border-radius: 4px 0 0 4px;
                      cursor: ew-resize; // 左句柄：调整起点 item.time
                    }

                    &.handle-right {
                      right: 0;
                      border-radius: 0 4px 4px 0;
                      cursor: ew-resize; // 右句柄：调整时长 item.timeLength
                    }

                    &:hover,
                    &:active {
                      background: rgba(255, 255, 255, 0.7);
                    }
                  }
                }

                .keyframe-node2 {
                  position: absolute;
                  top: 7px;
                  min-width: 12px;
                  height: 12px;
                  transform: translateX(-6px);
                  margin-top: -4px;
                  border-radius: 6px;
                  background: rgb(180, 177, 255);
                  border: 1px solid rgb(99, 91, 255);
                  box-sizing: border-box;
                  transition: transform 0.15s, background 0.15s;
                  z-index: 2;
                  cursor: grab; // 提示可拖拽调整位置

                  &:active {
                    cursor: grabbing;
                  }

                  &.range {
                    border-radius: 4px;
                    transform: none;

                    &:hover {
                      transform: none;
                    }

                    &.selected {
                      transform: none;
                    }
                  }

                  // keyframe-handle：range 节点左右两侧的边界调整句柄
                  // 默认半透明可见（不依赖父级 hover），hover 时提亮；pointer-events 默认 auto 可命中
                  .keyframe-handle {
                    position: absolute;
                    top: 0;
                    height: 100%;
                    width: 6px;
                    z-index: 3;
                    background: rgba(255, 255, 255, 0.35);
                    transition: background 0.15s;

                    &.handle-left {
                      left: 0;
                      border-radius: 4px 0 0 4px;
                      cursor: ew-resize; // 左句柄：调整起点 item.time
                    }

                    &.handle-right {
                      right: 0;
                      border-radius: 0 4px 4px 0;
                      cursor: ew-resize; // 右句柄：调整时长 item.timeLength
                    }

                    &:hover,
                    &:active {
                      background: rgba(255, 255, 255, 0.7);
                    }
                  }

                  &:hover {
                    box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.4);
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
            color: #888;
            white-space: nowrap;

            .locked-big-icon {
              font-size: 32px;
              opacity: 0.6;

              >img {
                width: 30px;
              }
            }

            .locked-message {
              font-size: 12px;
              font-weight: 500;
              color: #F7F7F5;
              background: #635BFF;
              padding: 4px 12px;
              border-radius: 12px;
              backdrop-filter: blur(4px);
            }
          }
        }
      }
    }
  }

  .timeline-ruler-leftPanel {
    width: 174px;
    height: 23px;
    overflow: auto;
    z-index: 101;
    position: absolute;
    top: 41px;
    background: #f7f7f5;
    border-bottom: 1px solid rgb(209, 209, 206);
    border-right: solid 1px rgb(209, 209, 206);
    color: rgb(154, 157, 162);
  }

  // .timeline-ruler：顶部时间刻度标尺，高度 24px，与轨道区域独立（不参与内部滚动）
  // ruler-track 实际宽度由内联 style :width="effectiveDuration * zoomLevel * 50" 控制
  .timeline-ruler {
    height: 24px;
    box-sizing: border-box;
    position: relative;
    overflow-x: hidden; // 隐藏标尺自身的横向滚动条（用 timeline-scroll-container 统一滚动）
    margin-left: 4px;
    border-bottom: 1px solid rgb(209, 209, 206);
    background: #f7f7f5;

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
