<template>
  <div class="map2d-container">
    <div class="left-panel">
      <div class="toolbar">
        <button :class="{ active: currentTool === 'wall' }" @click="changeCurrentTool('wall')" type="button">
          墙面
        </button>
        <button :class="{ active: currentTool === 'door' }" @click="changeCurrentTool('door')" type="button">
          门
        </button>
        <button :class="{ active: currentTool === 'window' }" @click="changeCurrentTool('window')" type="button">
          窗户
        </button>
        <button @click="clearDrawing" type="button">
          清空
        </button>
        <button @click="undo" type="button">
          撤销
        </button>
        <button @click="saveDrawing" type="button">
          保存
        </button>
        <button @click="loadDrawing" type="button">
          加载
        </button>
        <input type="file" id="fileInput" ref="fileInputRef" accept=".json" style="display: none"
          @change="handleFileChange" />
        <button :class="{ active: currentTool === 'drag' }" @click="changeCurrentTool('drag')" type="button">
          拖拽
        </button>
        <input type="number" v-model="wallThickness" placeholder="墙厚度" />
      </div>

      <div class="canvas-container">
        <canvas ref="canvasRef" @click="handleCanvasClick" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
          @mouseup="handleMouseUp" @contextmenu="handleContextMenu" class="drawing-canvas"
          :style="{ display: isSplitting ? 'none' : 'block' }" />
        <div v-if="contextMenu?.visible" class="context-menu"
          :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }">
          {{ editPropConfigInfo }}
          {{ editPropInputInfo }}
          <div>
            <label v-for="item in editPropConfigInfo" :key="item.id">
              {{ item.label }}：
              <input v-if="item.dataType === 'number'" type="number" v-model.number="editPropInputInfo[item.id]" />
            </label>
          </div>
          <div v-if="contextMenu.type === 'wall-point'">
            <label>
              墙体厚度：
              <input type="number" v-model.number="contextMenu.thickness" @change="updateWallThickness" />
            </label>
          </div>
          <button v-else @click="deleteContextMenuEntity">删除</button>
        </div>
      </div>
    </div>

    <div class="split-bar" @mousedown="startSplit" title="拖动调整左右比例"></div>

    <div class="right-panel">
      <!-- {{ drawingData }} -->
      {{ insertTempDoor }}
      <Canvas3D :data="drawingData" v-model:cameraState="cameraState" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Entity, Point } from '../types'
import { draw, canvasWidth, canvasHeight, snapThreshold } from '../utils/drawUtils'
import Canvas3D from '../components/Canvas3D.vue'
import { Wall } from '@/entities/wall/index.d'
import { Door } from '@/entities/door/index.d'
import { Window } from '@/entities/window/index.d'
import { DoorEntity, WallEntity, WindowEntity } from '@/entities'
import { EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { HandelInfo, PointWithIndex } from '@/types/map2d'
import pointToLineDistance from '@/utils/pointToLineDistance'
import { createDoorData, editPropConfig as doorEditPropConfig } from '@/entities/door'
import { createWindowData, editPropConfig as windowEditPropConfig } from '@/entities/window'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvas3DRef = ref<HTMLCanvasElement | null>(null)
const currentTool = ref<'wall' | 'door' | 'window' | 'drag'>('drag')
const walls = ref<Wall[]>([])
const doors = ref<Door[]>([])
const windows = ref<Window[]>([])
const tempDrawWall = ref<Wall | null>(null)
const hoverPoint = ref<Point | null>(null)
const lastPoint = ref<Point | null>(null)
const history = ref<Wall[][]>([])
const xAxisSnappedY = ref<{ objType: EntityType; number: number } | null>(null)
const yAxisSnappedX = ref<{ objType: EntityType; number: number } | null>(null)
const draggedPoint = ref<{ objType: 'wall'; wallIndex: number; pointIndex: number } | { type: 'door'; doorIndex: number } | { type: 'window'; windowIndex: number } | null>(null)
const dragOffset = ref<Point | null>(null)
const dragStartPoint = ref<Point | null>(null)
const prevTool = ref<'wall' | 'door' | 'window' | 'drag'>('wall')
const panOffset = ref<Point>({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref<Point | null>(null)
const splitPosition = ref(0.5)
const isSplitting = ref(false)
const canvasSize = ref({ width: 0, height: 0 })
const canvas3DSize = ref({ width: 0, height: 0 })
const zoomLevel = ref(1)
const wallThickness = ref<number>(20)
const cameraState = ref({
  targetPositionX: 0,
  targetPositionY: 0,
  targetPositionZ: 0,
  radius: 800,
  angleX: 0,
  angleY: Math.PI / 4
})
let insertTempDoor: Door | null = null;
let insertTempWindow: Window | null = null;
let panStartScreenX = 0
let panStartScreenY = 0

const updateCanvasSize = (skipPanelWidthUpdate = false) => {
  const container = document.querySelector('.map2d-container')
  if (!container) return

  if (!skipPanelWidthUpdate) {
    const leftPanel = document.querySelector('.left-panel') as HTMLElement
    const rightPanel = document.querySelector('.right-panel') as HTMLElement
    if (leftPanel && rightPanel) {
      leftPanel.style.width = (splitPosition.value * 100) + '%'
      rightPanel.style.width = ((1 - splitPosition.value) * 100) + '%'
    }
  }

  const canvas = canvasRef.value
  if (canvas) {
    const canvasContainer = document.querySelector('.canvas-container')
    if (canvasContainer) {
      const canvasRect = canvasContainer.getBoundingClientRect()
      const width = Math.floor(canvasRect.width)
      const height = Math.floor(canvasRect.height)
      // console.log('===width---', width)

      if (width > 0 && height > 0) {
        canvas.width = width
        canvas.height = height
        canvasSize.value = { width, height }
      }
    }
  }

  const canvas3D = canvas3DRef.value
  if (canvas3D) {
    const canvas3DContainer = document.querySelector('.canvas-3d-container')
    if (canvas3DContainer) {
      const canvas3DRect = canvas3DContainer.getBoundingClientRect()
      const width = Math.floor(canvas3DRect.width)
      const height = Math.floor(canvas3DRect.height)

      if (width > 0 && height > 0) {
        canvas3D.width = width
        canvas3D.height = height
        canvas3DSize.value = { width, height }
      }
    }
  }
  setTimeout(() => {
    drawWrapper()
  }, 30)
}

const drawingData = computed(() => ({
  walls: walls.value,
  doors: doors.value,
  windows: windows.value
}))

const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  type: 'door' | 'window' | 'wall-point';
  index?: number;
  wallIndex?: number;
  pointIndex?: number;
  thickness?: number
} | null>(null)

const editPropConfigInfo = ref<any[]>([])
const editPropInputInfo = ref<any>({})

interface NearestWallResult {
  wall: Wall
  lineIndex: number,
  pointOnWall: Point
  angle: number
}

const getNearestWall = (point: Point): NearestWallResult | null => {
  let nearestWall: Wall | null = null
  let nearestPoint: Point | null = null
  let minDistance = Infinity
  let nearestAngle = 0
  let lineIndex: number = -1;

  walls.value.forEach((wall: Wall) => {
    for (let i = 0; i < wall.points.length - 1; i++) {
      const p1 = wall.points[i]
      const p2 = wall.points[i + 1]

      const distance = pointToLineDistance(point, p1, p2)

      if (distance < minDistance) {
        minDistance = distance
        nearestWall = wall
        lineIndex = i;
        nearestPoint = getClosestPointOnLine(point, p1, p2)
        nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      }
    }
  })

  if (nearestPoint && lineIndex > -1 && minDistance < snapThreshold && nearestWall) {
    return {
      lineIndex,
      wall: nearestWall,
      pointOnWall: nearestPoint,
      angle: nearestAngle
    }
  }

  return null
}

const getClosestPointOnLine = (p: Point, a: Point, b: Point) => {
  const A = p.x - a.x
  const B = p.y - a.y
  const C = b.x - a.x
  const D = b.y - a.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  if (param < 0) {
    return { x: a.x, y: a.y }
  } else if (param > 1) {
    return { x: b.x, y: b.y }
  } else {
    return {
      x: a.x + param * C,
      y: a.y + param * D
    }
  }
}

const getSnapPoint = (
  startPoints: Array<MatchSnapPoint>, // 这里的点会计算角度磁吸
  current: Point,
  allPoints: Array<MatchSnapPoint> = [], // 点磁吸和轴磁吸
): MatchSnapPoint | null => {
  // 找到距离 current 最近的 start 点
  let nearestStart: MatchSnapPoint | null = null
  let minDistance = Infinity

  for (const start of startPoints) {
    const dist = Math.hypot(current.x - start.point.x, current.y - start.point.y)
    if (dist < minDistance) {
      minDistance = dist
      nearestStart = start
    }
  }
  // 一、计算三组磁吸数据
  // 计算点磁吸数据
  let pointSnapped: MatchSnapPoint | null = null
  let pointDistance = Infinity

  for (const point of allPoints) {
    const dist = Math.hypot(current.x - point.point.x, current.y - point.point.y)
    // 排除与 nearestStart 完全重合的点
    if (dist < 10 && !(nearestStart && point.point.x === nearestStart.point.x && point.point.y === nearestStart.point.y)) {
      if (dist < pointDistance) {
        pointDistance = dist
        pointSnapped = {
          objType: point.objType,
          objId: point.objId,
          snapFromType: point.snapFromType,
          point: point.point
        }
      }
    }
  }
  // 二、按照优先级依次尝试命中
  // 1. 最高优先级：点磁吸
  if (pointSnapped) {
    return {
      objType: pointSnapped.objType,
      snapFromType: pointSnapped.snapFromType,
      objId: pointSnapped.objId,
      point: {
        ...roundNumberList(pointSnapped.point),
        index: (pointSnapped.point as PointWithIndex).index,
      } as PointWithIndex
    };
  }

  let snappedX = current.x
  let snappedY = current.y

  const snapAngles = [0, 45, 90, 135, 180, -135, -90, -45]

  if (tempDrawWall.value?.points?.length && tempDrawWall.value.points.length > 1) {
    const prev = tempDrawWall.value.points[tempDrawWall.value.points.length - 2]
    const last = tempDrawWall.value.points[tempDrawWall.value.points.length - 1]
    const prevDx = last.x - prev.x
    const prevDy = last.y - prev.y
    const prevAngle = Math.atan2(prevDy, prevDx)
    const prevAngleDeg = prevAngle * 180 / Math.PI

    let perpendicularAngle1 = prevAngleDeg + 90
    let perpendicularAngle2 = prevAngleDeg - 90

    if (perpendicularAngle1 > 180) perpendicularAngle1 -= 360
    if (perpendicularAngle1 < -180) perpendicularAngle1 += 360
    if (perpendicularAngle2 > 180) perpendicularAngle2 -= 360
    if (perpendicularAngle2 < -180) perpendicularAngle2 += 360

    snapAngles.push(perpendicularAngle1, perpendicularAngle2)
  }

  // 2. 第二优先级：角度+轴对齐组合（计算交点）
  // 3. 计算轴对齐磁吸数据
  let xAxisSnappedYVal: {
    objType: EntityType,
    objId: string,
    number: number
  } | null = null // 命中的y坐标值（水平对齐，即y值与某个点一致）
  let yAxisSnappedXVal: {
    objType: EntityType,
    objId: string,
    number: number
  } | null = null // 命中的x坐标值（垂直对齐，即x值与某个点一致）
  let xAxisDistance = Infinity // 命中x轴对齐的最小距离
  let yAxisDistance = Infinity // 命中y轴对齐的最小距离
  for (const point of allPoints) {
    const distToXAxis = Math.abs(current.y - point.point.y)
    if (distToXAxis < 10 && distToXAxis < xAxisDistance) {
      xAxisDistance = distToXAxis
      xAxisSnappedYVal = {
        objType: point.objType,
        objId: point.objId,
        number: point.point.y
      }
    }

    const distToYAxis = Math.abs(current.x - point.point.x)
    if (distToYAxis < 10 && distToYAxis < yAxisDistance) {
      yAxisDistance = distToYAxis
      yAxisSnappedXVal = {
        objType: point.objType,
        objId: point.objId,
        number: point.point.x
      }
    }
  }

  // 更新ref值用于绘制参考线
  xAxisSnappedY.value = xAxisSnappedYVal
  yAxisSnappedX.value = yAxisSnappedXVal

  if (startPoints.length && nearestStart) {
    const dx = current.x - nearestStart.point.x
    const dy = current.y - nearestStart.point.y
    let nearestSnapAngle = 0 // 最近的角度(startPoints里比对)
    let minAngleDiff = 180

    for (const snapAngle of snapAngles) {
      const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI
      let diff = Math.abs(angleDeg - snapAngle)
      if (diff > 180) {
        diff = 360 - diff
      }

      if (diff < minAngleDiff) {
        minAngleDiff = diff
        nearestSnapAngle = snapAngle
      }
    }
    // 1. 计算角度磁吸数据
    let angleSnapped: {
      objType: EntityType,
      objId: string,
      point: Point
    } | null = null
    let angleDistance = Infinity
    if (minAngleDiff < 10) {
      const length = Math.hypot(dx, dy)
      const snapAngleRad = nearestSnapAngle * Math.PI / 180
      const snappedXTemp = nearestStart.point.x + length * Math.cos(snapAngleRad)
      const snappedYTemp = nearestStart.point.y + length * Math.sin(snapAngleRad)
      const distToMouse = Math.hypot(snappedXTemp - current.x, snappedYTemp - current.y)
      if (distToMouse < 10) {
        angleSnapped = {
          objType: nearestStart.objType,
          objId: nearestStart.objId,
          point: {
            x: snappedXTemp,
            y: snappedYTemp
          }
        }
        angleDistance = distToMouse
      }
    }
    if (angleSnapped && (xAxisSnappedY.value !== null || yAxisSnappedX.value !== null)) {
      const angleRad = nearestSnapAngle * Math.PI / 180
      const k = Math.tan(angleRad)
      const b = angleSnapped.point.y - k * angleSnapped.point.x

      if (xAxisSnappedYVal !== null && yAxisSnappedXVal !== null) {
        // 同时命中x和y轴，计算角度线与两条轴对齐线的交点，选择更近的
        // 交点1：角度线与 x = yAxisSnappedXVal 的交点
        const intersect1Y = k * yAxisSnappedXVal.number + b
        const dist1 = Math.hypot(yAxisSnappedXVal.number - current.x, intersect1Y - current.y)

        // 交点2：角度线与 y = xAxisSnappedYVal 的交点
        let intersect2X: number
        if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
          intersect2X = angleSnapped.point.x
        } else if (Math.abs(angleRad) < 0.01 || Math.abs(angleRad - Math.PI) < 0.01 || Math.abs(angleRad + Math.PI) < 0.01) {
          intersect2X = xAxisSnappedYVal.number
        } else {
          intersect2X = (xAxisSnappedYVal.number - b) / k
        }
        const dist2 = Math.hypot(intersect2X - current.x, xAxisSnappedYVal.number - current.y)

        if (dist1 <= dist2) {
          snappedX = yAxisSnappedXVal.number
          snappedY = intersect1Y
        } else {
          snappedX = intersect2X
          snappedY = xAxisSnappedYVal.number
        }
      } else if (yAxisSnappedXVal !== null) {
        // 命中y轴对齐：交点是 (yAxisSnappedXVal, k * yAxisSnappedXVal + b)
        // 处理垂直线情况（90度或-90度）
        if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
          snappedX = yAxisSnappedXVal.number
          snappedY = angleSnapped.point.y
        } else {
          snappedX = yAxisSnappedXVal.number
          snappedY = k * yAxisSnappedXVal.number + b
        }
      } else if (xAxisSnappedYVal !== null) {
        // 命中x轴对齐：交点是 ((xAxisSnappedYVal - b) / k, xAxisSnappedYVal)
        // 处理水平线情况（0度或180度，k=0）和垂直线情况（90度或-90度）
        if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
          // 垂直线：x保持不变
          snappedX = current.x
        } else if (Math.abs(angleRad) < 0.01 || Math.abs(angleRad - Math.PI) < 0.01 || Math.abs(angleRad + Math.PI) < 0.01) {
          // 水平线：y保持为xAxisSnappedYVal，x使用angleSnapped.x
          snappedX = angleSnapped.point.x
        } else {
          snappedX = (xAxisSnappedYVal.number - b) / k
        }
        snappedY = xAxisSnappedYVal.number
      }
      return {
        objType: nearestStart.objType,
        objId: nearestStart.objId,
        snapFromType: 'line',
        point: roundNumberList({
          x: snappedX,
          y: snappedY
        })
      }
    }
    // 3. 第三优先级：单独角度磁吸
    if (angleSnapped) {
      snappedX = angleSnapped.point.x
      snappedY = angleSnapped.point.y
      return {
        objType: angleSnapped.objType,
        objId: angleSnapped.objId,
        snapFromType: 'line',
        point: roundNumberList({
          x: snappedX,
          y: snappedY
        })
      }
    }
  }
  // 4. 第四优先级：单独轴对齐磁吸
  if (xAxisSnappedYVal !== null && yAxisSnappedXVal !== null) {
    snappedX = yAxisSnappedXVal.number
    snappedY = xAxisSnappedYVal.number
    return {
      objType: yAxisSnappedXVal.objType,
      objId: yAxisSnappedXVal.objId,
      snapFromType: 'axis',
      point: roundNumberList({
        x: snappedX,
        y: snappedY
      })
    }
  }
  if (yAxisSnappedXVal !== null) {
    snappedX = yAxisSnappedXVal.number
    snappedY = current.y
    return {
      objType: yAxisSnappedXVal.objType,
      objId: yAxisSnappedXVal.objId,
      snapFromType: 'axis',
      point: roundNumberList({
        x: snappedX,
        y: snappedY
      })
    }
  }
  if (xAxisSnappedYVal !== null) {
    snappedX = current.x
    snappedY = xAxisSnappedYVal.number
    return {
      objType: xAxisSnappedYVal.objType,
      objId: xAxisSnappedYVal.objId,
      snapFromType: 'axis',
      point: roundNumberList({
        x: snappedX,
        y: snappedY
      })
    }
  }
  return null
}

function roundNumberList(point: { x: number, y: number }) {
  return { x: Math.round(point.x), y: Math.round(point.y) }
}

const drawWrapper = () => {
  const canvas = canvasRef.value
  if (canvas) {
    draw(
      canvas,
      walls.value,
      doors.value,
      windows.value,
      tempDrawWall.value?.points || [],
      hoverPoint.value,
      currentTool.value,
      xAxisSnappedY.value === null ? null : xAxisSnappedY.value?.number,
      yAxisSnappedX.value === null ? null : yAxisSnappedX.value?.number,
      panOffset.value,
      canvasSize.value.width,
      canvasSize.value.height,
      zoomLevel.value,
      insertTempDoor,
      insertTempWindow,
    )
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.canvas.width = canvasWidth
      ctx.canvas.height = canvasHeight;
      nextTick(() => {
        // (0,0)位移到中央
        const canvasContainer = document.querySelector('.canvas-container')
        if (canvasContainer) {
          const canvasRect = canvasContainer.getBoundingClientRect()
          const dx = canvasRect.width / 2
          const dy = canvasRect.height / 2
          panOffset.value.x += dx
          panOffset.value.y += dy
          panStartScreenX = screenX
          panStartScreenY = screenY
          drawWrapper()
        }
      })
      drawWrapper()
    }

    window.addEventListener('resize', () => updateCanvasSize(true))
    updateCanvasSize()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (tempDrawWall.value?.points?.length && tempDrawWall.value.points.length > 0) {
          if (tempDrawWall.value?.points.length > 1) {
            const firstPoint = tempDrawWall.value.points[0]
            const newWall: Wall = {
              id: tempDrawWall.value.id,
              x: firstPoint.x,
              y: firstPoint.y,
              points: [...tempDrawWall.value.points],
              thickness: wallThickness.value
            }
            walls.value.push(newWall)
            history.value.push(JSON.parse(JSON.stringify(walls.value)))
          }
          tempDrawWall.value = null
          lastPoint.value = null
          hoverPoint.value = null
        }
        drawWrapper()
        currentTool.value = 'drag'
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }
})

const fileInputRef = ref<HTMLInputElement | null>(null)

const saveDrawing = () => {
  const data = {
    walls: walls.value,
    doors: doors.value,
    windows: windows.value,
    panOffset: panOffset.value,
    zoomLevel: zoomLevel.value,
    cameraState: cameraState.value
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'floor-plan.json'
  a.click()
  URL.revokeObjectURL(url)
}

const loadDrawing = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target?.result as string)
      walls.value = data.walls || []
      doors.value = data.doors || []
      windows.value = data.windows || []
      panOffset.value = data.panOffset || { x: 0, y: 0 }
      zoomLevel.value = data.zoomLevel || 1
      if (data.cameraState) {
        cameraState.value = data.cameraState
      }
      history.value = []
      drawWrapper()
    } catch (error) {
      alert('文件格式错误')
    }
  }
  reader.readAsText(file)
  input.value = ''
}

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  editPropConfigInfo.value = []
  editPropInputInfo.value = {}
  // 检查是否点击了墙上的点
  for (let i = 0; i < walls.value.length; i++) {
    const wall = walls.value[i]
    for (let j = 0; j < wall.points.length; j++) {
      const point = wall.points[j]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < 10) {
        contextMenu.value = {
          visible: true,
          x: e.clientX,
          y: e.clientY,
          type: 'wall-point',
          wallIndex: i,
          pointIndex: j,
          thickness: wall.thickness || 2
        }
        return
      }
    }
  }

  // 检查是否点击了门
  for (let i = 0; i < doors.value.length; i++) {
    const door = doors.value[i]
    const dist = Math.hypot(x - door.x, y - door.y)
    if (dist < 10) {
      editPropConfigInfo.value = doorEditPropConfig()
      editPropInputInfo.value = door;
      contextMenu.value = {
        visible: true,
        x: e.clientX,
        y: e.clientY,
        type: 'door',
        index: i
      }
      return
    }
  }

  // 检查是否点击了窗户
  for (let i = 0; i < windows.value.length; i++) {
    const windowItem = windows.value[i]
    const dist = Math.hypot(x - windowItem.x, y - windowItem.y)
    if (dist < 10) {
      editPropConfigInfo.value = windowEditPropConfig()
      editPropInputInfo.value = windowItem;
      contextMenu.value = {
        visible: true,
        x: e.clientX,
        y: e.clientY,
        type: 'window',
        index: i
      }
      return
    }
  }

  contextMenu.value = null
}

const deleteContextMenuEntity = () => {
  if (!contextMenu.value) return

  if (contextMenu.value.type === 'door') {
    doors.value.splice(contextMenu.value.index!, 1)
  } else if (contextMenu.value.type === 'window') {
    windows.value.splice(contextMenu.value.index!, 1)
  }

  contextMenu.value = null
  drawWrapper()
}

const updateWallThickness = () => {
  if (contextMenu.value?.type === 'wall-point' && contextMenu.value.wallIndex !== undefined && contextMenu.value.thickness !== undefined) {
    walls.value[contextMenu.value.wallIndex].thickness = contextMenu.value.thickness
    contextMenu.value = null
    drawWrapper()
  }
}

const handleCanvasClick = (e: MouseEvent) => {
  // 如果当前是拖拽模式，不执行任何操作
  if (currentTool.value === 'drag') {
    return
  }
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  // 点击空白处隐藏 context menu
  if (contextMenu.value) {
    contextMenu.value = null
    return
  }

  if (currentTool.value === 'wall') {
    let clickPoint: Point = { x, y }

    if (tempDrawWall.value) {
      if (tempDrawWall.value.points.length > 0) {
        const last = {
          ...tempDrawWall.value.points[tempDrawWall.value.points.length - 1],
          index: tempDrawWall.value.points.length - 1,
        }
        // 收集所有点（包括临时折线和已绘制的墙上的点）
        const allPoints = [...tempDrawWall.value.points]
        walls.value.forEach(wall => {
          wall.points.forEach(point => {
            allPoints.push(point)
          })
        })
        let snapped = getSnapPoint([{
          objType: 'wall',
          objId: tempDrawWall.value.id,
          snapFromType: 'point',
          point: last
        }], clickPoint, allPoints.map((v, index) => ({
          objType: 'wall',
          objId: (tempDrawWall.value as Wall).id,
          snapFromType: 'point',
          point: {
            ...v,
            index: index,
          }
        })))
        if (snapped === null) {
          snapped = {
            objType: 'wall',
            objId: tempDrawWall.value.id,
            snapFromType: 'point',
            point: clickPoint
          }
        }
        const dist = Math.hypot(snapped.point.x - last.x, snapped.point.y - last.y)

        if (dist < 10 * zoomLevel.value) {
          if (tempDrawWall.value?.points?.length && tempDrawWall.value.points.length > 1) {
            const newWall: Wall = {
              id: Date.now().toString(),
              points: [...tempDrawWall.value.points],
              x: snapped.point.x,
              y: snapped.point.y,
              thickness: wallThickness.value
            }
            walls.value.push(newWall)
            history.value.push(JSON.parse(JSON.stringify(walls.value)))
            tempDrawWall.value.points = []
            lastPoint.value = null
          }
          return
        }
        clickPoint = snapped.point
      }
      tempDrawWall.value?.points?.push(clickPoint)
    } else {
      tempDrawWall.value = {
        id: Date.now().toString(),
        x: clickPoint.x,
        y: clickPoint.y,
        points: [clickPoint],
        thickness: wallThickness.value
      }
    }
    lastPoint.value = clickPoint
  } else {
    if (hoverPoint.value) {
      if (currentTool.value === 'door') {
        if (insertTempDoor) {
          doors.value.push(insertTempDoor)
          insertTempDoor = null;
        }
      } else if (currentTool.value === 'window') {
        if (insertTempWindow) {
          windows.value.push(insertTempWindow)
          insertTempWindow = null;
        }
      }
    }
  }

  drawWrapper()
}

const clearDrawing = () => {
  if (confirm('确定要清空所有绘制内容吗？')) {
    walls.value = []
    doors.value = []
    windows.value = []
    if (tempDrawWall.value) {
      tempDrawWall.value = null
    }
    history.value = []
    drawWrapper()
  }
}

const undo = () => {
  if (history.value.length > 0) {
    walls.value = history.value.pop() || []
    drawWrapper()
  }
}

const handleMouseMove = (e: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  // 如果正在拖拽，处理拖拽逻辑（即使当前工具不是 drag）
  if (matchHandelObj && matchHandelInfo) {
    // const dragged = draggedPoint.value
    // let originalPoint: Point = { x: 0, y: 0 }
    // let prevPoint: Point | null = null
    // let nextPoint: Point | null = null

    // if (dragged.type === 'wall') {
    //   if (dragged.wallIndex === -1) {
    //     originalPoint = tempWallPoints.value[dragged.pointIndex]
    //     if (dragged.pointIndex > 0) {
    //       prevPoint = tempWallPoints.value[dragged.pointIndex - 1]
    //     }
    //     if (dragged.pointIndex < tempWallPoints.value.length - 1) {
    //       nextPoint = tempWallPoints.value[dragged.pointIndex + 1]
    //     }
    //   } else {
    //     originalPoint = walls.value[dragged.wallIndex].points[dragged.pointIndex]
    //     const wall = walls.value[dragged.wallIndex]
    //     if (dragged.pointIndex > 0) {
    //       prevPoint = wall.points[dragged.pointIndex - 1]
    //     }
    //     if (dragged.pointIndex < wall.points.length - 1) {
    //       nextPoint = wall.points[dragged.pointIndex + 1]
    //     }
    //   }
    // } else if (dragged.type === 'door') {
    //   originalPoint = { x: doors.value[dragged.doorIndex].x, y: doors.value[dragged.doorIndex].y }
    // } else if (dragged.type === 'window') {
    //   originalPoint = { x: windows.value[dragged.windowIndex].x, y: windows.value[dragged.windowIndex].y }
    // }

    // const allPoints = [...tempWallPoints.value]
    // walls.value.forEach((wall) => {
    //   wall.points.forEach(point => {
    //     allPoints.push(point)
    //   })
    // })
    // // doors.value.forEach((door, doorIdx) => {
    // //   if (dragged.type !== 'door' || doorIdx !== dragged.doorIndex) {
    // //     allPoints.push({ x: door.x, y: door.y })
    // //   }
    // // })
    // // windows.value.forEach((win, winIdx) => {
    // //   if (dragged.type !== 'window' || winIdx !== dragged.windowIndex) {
    // //     allPoints.push({ x: win.x, y: win.y })
    // //   }
    // // })

    // const startPoints: Point[] = []
    // if (prevPoint) startPoints.push(prevPoint)
    // if (nextPoint) startPoints.push(nextPoint)
    // if (startPoints.length === 0) startPoints.push(originalPoint)

    // const targetX = x - (dragOffset.value?.x || 0)
    // const targetY = y - (dragOffset.value?.y || 0)
    function temp(api: EntityClass<Entity>): boolean {
      if (matchHandelObj && matchHandelInfo) {
        let beMatchPoints = api.getMineBeSnapPoints()
        // 排出掉和自己磁吸
        beMatchPoints = beMatchPoints.filter(v => {
          if (v.snapFromType === 'point') {
            if (v.point.index === matchHandelInfo?.index) {
              return false;
            }
          }
          return true;
        })
        if (beMatchPoints.length > 0) {
          const snapped = getSnapPoint([], { x, y }, beMatchPoints)
          if (snapped !== null) {
            const result = matchHandelObj.inSceneSnapPointArea(
              {
                objType: api.type,
                objId: snapped.objId,
                snapFromType: 'point',
                point: snapped.point
              },
              matchHandelInfo,
            )
            if (result) {
              drawWrapper()
              return true;
            }
          }
        }
        const beMatchLines = api.getMineBeSnapLines()
        if (beMatchLines.length > 0) {
          let nearestPoint: Point | null = null
          let minDistance = Infinity
          let matchLine = null;
          for (let j = 0; j < beMatchLines.length; j++) {
            const line = beMatchLines[j]
            const distance = pointToLineDistance({ x, y }, line[0], line[1])
            if (distance < minDistance) {
              matchLine = line
              minDistance = distance
              nearestPoint = getClosestPointOnLine({ x, y }, line[0], line[1])
            }
          }
          if (nearestPoint && minDistance < snapThreshold) {
            const result = matchHandelObj.inSceneSnapPointArea({
              objType: api.type,
              objId: api.data.id,
              snapFromType: 'line',
              point: nearestPoint
            }, matchHandelInfo)
            if (result) {
              if (matchLine) {
                matchHandelObj.afterBeSnapByLine(api, matchLine)
              }
              drawWrapper()
              return true;
            }
          }
        }
      }
      return false;
    }
    for (let i = 0; i < walls.value.length; i++) {
      const wall = walls.value[i]
      const api = new WallEntity(wall)
      if (temp(api)) {
        return;
      }
    }
    matchHandelObj.matchHandelMoveCallback(x, y, matchHandelInfo)
    drawWrapper()
  }

  // 如果正在平移画布
  if (isPanning.value && panStart.value) {
    const dx = screenX - panStartScreenX
    const dy = screenY - panStartScreenY
    panOffset.value.x += dx
    panOffset.value.y += dy
    panStart.value = { x, y }
    panStartScreenX = screenX
    panStartScreenY = screenY
    drawWrapper()
    return
  }

  // 如果当前是拖拽模式，处理拖拽逻辑
  if (currentTool.value === 'drag') {
    drawWrapper()
    return
  }

  if (currentTool.value === 'wall') {
    if (tempDrawWall.value && tempDrawWall.value?.points?.length && tempDrawWall.value.points.length > 0) {
      const last = tempDrawWall.value.points[tempDrawWall.value.points.length - 1]
      const dist = Math.hypot(x - last.x, y - last.y)

      if (dist < snapThreshold) {
        hoverPoint.value = { ...last }
      } else {
        // 收集所有点（包括临时折线和已绘制的墙上的点）
        const allPoints = [...tempDrawWall.value.points]
        walls.value.forEach(wall => {
          wall.points.forEach(point => {
            allPoints.push(point)
          })
        })
        let snappedPoint = getSnapPoint([{
          objType: 'wall',
          objId: tempDrawWall.value.id,
          snapFromType: 'point',
          point: last
        }], { x, y }, allPoints.map(v => ({
          objType: 'wall',
          objId: (tempDrawWall.value as Wall).id,
          snapFromType: 'point',
          point: v
        })))
        if (snappedPoint === null) {
          snappedPoint = {
            objType: 'wall',
            objId: tempDrawWall.value.id,
            snapFromType: 'point',
            point: { x, y }
          }
        }
        if (snappedPoint) {
          hoverPoint.value = snappedPoint.point
        }
      }
    }
  } else {
    const nearest = getNearestWall({ x, y })
    if (nearest) {
      hoverPoint.value = nearest.pointOnWall
      if (currentTool.value === 'door') {
        if (insertTempDoor === null) {
          insertTempDoor = createDoorData();
        }
        const { pointOnWall, angle } = nearest
        const wallScreenX = pointOnWall.x
        const wallScreenY = pointOnWall.y
        insertTempDoor.wallId = nearest.wall.id
        insertTempDoor.wallPointId = nearest.lineIndex
        insertTempDoor.x = wallScreenX
        insertTempDoor.y = wallScreenY
        insertTempDoor.angle = angle
      } else if (currentTool.value === 'window') {
        if (insertTempWindow === null) {
          insertTempWindow = createWindowData();
        }
        const { pointOnWall, angle } = nearest
        const wallScreenX = pointOnWall.x
        const wallScreenY = pointOnWall.y
        insertTempWindow.wallId = nearest.wall.id
        insertTempWindow.wallPointId = nearest.lineIndex
        insertTempWindow.x = wallScreenX
        insertTempWindow.y = wallScreenY
        insertTempWindow.angle = angle
      }
    } else {
      hoverPoint.value = null
    }
  }

  drawWrapper()
}

let matchHandelObj: EntityClass<any> | null = null;
let matchHandelInfo: HandelInfo | null = null;
const handleMouseDown = (e: MouseEvent) => {
  contextMenu.value = null;

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  // 只有在拖拽模式下才能拖拽点
  if (currentTool.value === 'drag') {
    if (e.button !== 0) return
    // 检查已绘制的墙上的点
    for (let i = 0; i < walls.value.length; i++) {
      const wall = walls.value[i]
      const api = new WallEntity(wall)
      const matchInfo = api.matchHandelInfo(x, y, zoomLevel.value)
      if (matchInfo) {
        matchHandelObj = api;
        matchHandelInfo = matchInfo
        dragOffset.value = { x: 0, y: 0 };
        dragStartPoint.value = { x, y }
        return;
      }
    }

    // 检查门
    for (let i = 0; i < doors.value.length; i++) {
      const door = doors.value[i]
      const api = new DoorEntity(door)
      const matchInfo = api.matchHandelInfo(x, y, zoomLevel.value)
      if (matchInfo) {
        matchHandelObj = api;
        matchHandelInfo = matchInfo
        dragOffset.value = { x: 0, y: 0 };
        dragStartPoint.value = { x, y }
        return;
      }
      // const dist = Math.hypot(x - door.x, y - door.y)
      // if (dist < wallThickness.value * zoomLevel.value) {
      //   draggedPoint.value = { type: 'door', doorIndex }
      //   dragOffset.value = { x: door.x - x, y: door.y - y }
      //   prevTool.value = currentTool.value
      //   drawWrapper()
      // }
    }

    // 检查窗户
    for (let i = 0; i < windows.value.length; i++) {
      const windowItem = windows.value[i]
      const api = new WindowEntity(windowItem)
      const matchInfo = api.matchHandelInfo(x, y, zoomLevel.value)
      if (matchInfo) {
        matchHandelObj = api;
        matchHandelInfo = matchInfo
        dragOffset.value = { x: 0, y: 0 };
        dragStartPoint.value = { x, y }
        return;
      }

      // const dist = Math.hypot(x - windowItem.x, y - windowItem.y)
      // if (dist < wallThickness.value * zoomLevel.value) {
      //   draggedPoint.value = { type: 'window', windowIndex }
      //   dragOffset.value = { x: windowItem.x - x, y: windowItem.y - y }
      //   prevTool.value = currentTool.value
      //   drawWrapper()
      // }
    }

    // 如果没有拖拽到任何点，开始平移
    if (!draggedPoint.value) {
      isPanning.value = true
      panStart.value = { x, y }
      panStartScreenX = screenX
      panStartScreenY = screenY
      prevTool.value = currentTool.value
    }
  }
}

const handleMouseUp = () => {
  matchHandelObj = null
  matchHandelInfo = null
  if (draggedPoint.value !== null) {
    history.value.push(JSON.parse(JSON.stringify(walls.value)))
    draggedPoint.value = null
    dragOffset.value = null
    currentTool.value = prevTool.value
    drawWrapper()
  }
  if (isPanning.value) {
    isPanning.value = false
    panStart.value = null
    currentTool.value = prevTool.value
    drawWrapper()
  }
}

const startSplit = (e: MouseEvent) => {
  isSplitting.value = true
  document.body.style.cursor = 'col-resize'
  e.preventDefault()
}

const handleMouseMoveSplit = (e: MouseEvent) => {
  if (!isSplitting.value) return

  const container = document.querySelector('.map2d-container')
  if (!container) return

  const rect = container.getBoundingClientRect()
  const containerWidth = rect.width
  const newSplitPosition = (e.clientX - rect.left) / containerWidth

  const minRatio = 0.2
  const maxRatio = 0.8

  let finalRatio: number
  if (newSplitPosition < minRatio) finalRatio = minRatio
  else if (newSplitPosition > maxRatio) finalRatio = maxRatio
  else finalRatio = newSplitPosition

  splitPosition.value = finalRatio

  const leftPanel = document.querySelector('.left-panel') as HTMLElement
  const rightPanel = document.querySelector('.right-panel') as HTMLElement
  if (leftPanel && rightPanel) {
    leftPanel.style.width = (finalRatio * 100) + '%'
    rightPanel.style.width = ((1 - finalRatio) * 100) + '%'
  }
}

const handleMouseUpSplit = () => {
  if (isSplitting.value) {
    isSplitting.value = false
    document.body.style.cursor = 'default'
    updateCanvasSize(true)
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMoveSplit)
  window.addEventListener('mouseup', handleMouseUpSplit)

  const canvas = canvasRef.value
  if (canvas) {
    canvas.addEventListener('wheel', handleWheel)
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMoveSplit)
  window.removeEventListener('mouseup', handleMouseUpSplit)

  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('wheel', handleWheel)
  }
})

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
  const newZoomLevel = Math.max(0.1, Math.min(5, zoomLevel.value * zoomFactor))

  const zoomRatio = newZoomLevel / zoomLevel.value
  const newPanX = mouseX - (mouseX - panOffset.value.x) * zoomRatio
  const newPanY = mouseY - (mouseY - panOffset.value.y) * zoomRatio

  zoomLevel.value = newZoomLevel
  panOffset.value = { x: newPanX, y: newPanY }

  drawWrapper()
}
function changeCurrentTool(type: 'wall' | 'door' | 'window' | 'drag') {
  insertTempDoor = null
  insertTempWindow = null
  if (type === 'door') {
    insertTempDoor = createDoorData();
  } else if (type === 'window') {
    insertTempWindow = createWindowData();
  }
  currentTool.value = type
}
</script>

<style scoped>
.map2d-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.toolbar {
  display: flex;
  padding: 8px;
  background: white;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.toolbar button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: #e4e6eb;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.toolbar button:hover {
  background: #d9d9d9;
}

.toolbar button.active {
  background: #1890ff;
  color: white;
}

.canvas-container {
  flex-grow: 1;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.drawing-canvas {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
  width: 100%;
  height: 100%;
}

.left-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
}

.right-panel {
  height: 100%;
  padding: 20px;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
}

.split-bar {
  width: 4px;
  background: #d9d9d9;
  cursor: col-resize;
  transition: background 0.2s;
  z-index: 100;
}

.split-bar:hover {
  background: #1890ff;
}

.left-panel,
.right-panel {
  transition: width 0.1s ease;
}

.preview-label {
  margin-bottom: 20px;
  font-size: 16px;
  color: #666;
}

.canvas-3d-container {
  width: 100%;
  height: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.drawing-canvas-3d {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.context-menu {
  position: absolute;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 5px 0;
  z-index: 1000;
}

.context-menu button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #ff4d4f;
}

.context-menu button:hover {
  background: #f5f5f5;
}
</style>
