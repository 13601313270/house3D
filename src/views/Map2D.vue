<template>
  <div class="map2d-container">
    <div class="left-panel">
      <div class="toolbar">
        <button :class="{ active: currentTool === 'wall' }" @click="currentTool = 'wall'" type="button">
          墙面
        </button>
        <button :class="{ active: currentTool === 'door' }" @click="currentTool = 'door'" type="button">
          门
        </button>
        <button :class="{ active: currentTool === 'window' }" @click="currentTool = 'window'" type="button">
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
        <button :class="{ active: currentTool === 'drag' }" @click="currentTool = 'drag'" type="button">
          拖拽
        </button>
      </div>

      <div class="canvas-container">
        <canvas ref="canvasRef" @click="handleCanvasClick" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
          @mouseup="handleMouseUp" @contextmenu="handleContextMenu" class="drawing-canvas"
          :style="{ display: isSplitting ? 'none' : 'block' }" />
        <div v-if="contextMenu?.visible" class="context-menu"
          :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }">
          <button @click="deleteContextMenuEntity">删除</button>
        </div>
      </div>
    </div>

    <div class="split-bar" @mousedown="startSplit" title="拖动调整左右比例"></div>

    <div class="right-panel">
      <Canvas3D :data="drawingData" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Point, Wall, Door, Window } from '../types/map2d'
import { draw, drawPoint, drawEntity, drawPreviewEntity, canvasWidth, canvasHeight, snapThreshold, doorWidth, windowWidth, wallThickness } from '../utils/drawUtils'
import Canvas3D from '../components/Canvas3D.vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvas3DRef = ref<HTMLCanvasElement | null>(null)
const currentTool = ref<'wall' | 'door' | 'window' | 'drag'>('wall')
const walls = ref<Wall[]>([])
const doors = ref<Door[]>([])
const windows = ref<Window[]>([])
const tempWallPoints = ref<Point[]>([])
const hoverPoint = ref<Point | null>(null)
const lastPoint = ref<Point | null>(null)
const history = ref<Wall[][]>([])
const xAxisSnappedY = ref<number | null>(null)
const yAxisSnappedX = ref<number | null>(null)
const draggedPoint = ref<{ type: 'wall'; wallIndex: number; pointIndex: number } | { type: 'door'; doorIndex: number } | { type: 'window'; windowIndex: number } | null>(null)
const dragOffset = ref<Point | null>(null)
const prevTool = ref<'wall' | 'door' | 'window' | 'drag'>('wall')
const panOffset = ref<Point>({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref<Point | null>(null)
const splitPosition = ref(0.5)
const isSplitting = ref(false)
const canvasSize = ref({ width: 0, height: 0 })
const canvas3DSize = ref({ width: 0, height: 0 })
const zoomLevel = ref(1)
const isZooming = ref(false)
let panStartScreenX = 0
let panStartScreenY = 0

const updateCanvasSize = (skipPanelWidthUpdate = false) => {
  const container = document.querySelector('.map2d-container')
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const containerWidth = containerRect.width
  const containerHeight = containerRect.height

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
      console.log('===width---', width)

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

const contextMenu = ref<{ visible: boolean; x: number; y: number; type: 'door' | 'window'; index: number } | null>(null)

interface NearestWallResult {
  wall: Wall
  pointOnWall: Point
  angle: number
}

const getNearestWall = (point: Point): NearestWallResult | null => {
  let nearestWall: Wall | null = null
  let nearestPoint: Point | null = null
  let minDistance = Infinity
  let nearestAngle = 0

  walls.value.forEach((wall) => {
    for (let i = 0; i < wall.points.length - 1; i++) {
      const p1 = wall.points[i]
      const p2 = wall.points[i + 1]

      const distance = pointToLineDistance(point, p1, p2)

      if (distance < minDistance) {
        minDistance = distance
        nearestWall = wall
        nearestPoint = getClosestPointOnLine(point, p1, p2)
        nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      }
    }
  })

  if (nearestPoint && minDistance < snapThreshold && nearestWall) {
    return { wall: nearestWall, pointOnWall: nearestPoint, angle: nearestAngle }
  }

  return null
}

const pointToLineDistance = (p: Point, a: Point, b: Point) => {
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

  let xx, yy

  if (param < 0) {
    xx = a.x
    yy = a.y
  } else if (param > 1) {
    xx = b.x
    yy = b.y
  } else {
    xx = a.x + param * C
    yy = a.y + param * D
  }

  const dx = p.x - xx
  const dy = p.y - yy

  return Math.sqrt(dx * dx + dy * dy)
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

const getSnapPoint = (startPoints: Point[], current: Point, allPoints: Point[] = []): Point => {
  // 找到距离 current 最近的 start 点
  let nearestStart: Point | null = null
  let minDistance = Infinity

  for (const start of startPoints) {
    const dist = Math.hypot(current.x - start.x, current.y - start.y)
    if (dist < minDistance) {
      minDistance = dist
      nearestStart = start
    }
  }

  if (!nearestStart) {
    return { x: current.x, y: current.y }
  }

  const dx = current.x - nearestStart.x
  const dy = current.y - nearestStart.y
  const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI

  let snappedX = current.x
  let snappedY = current.y

  const snapAngles = [0, 45, 90, 135, 180, -135, -90, -45]

  if (tempWallPoints.value.length > 1) {
    const prev = tempWallPoints.value[tempWallPoints.value.length - 2]
    const last = tempWallPoints.value[tempWallPoints.value.length - 1]
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

  let nearestSnapAngle = 0
  let minAngleDiff = 180

  for (const snapAngle of snapAngles) {
    let diff = Math.abs(angleDeg - snapAngle)
    if (diff > 180) {
      diff = 360 - diff
    }

    if (diff < minAngleDiff) {
      minAngleDiff = diff
      nearestSnapAngle = snapAngle
    }
  }

  // 一、计算三组磁吸数据

  // 1. 计算角度磁吸数据
  let angleSnapped: Point | null = null
  let angleDistance = Infinity

  if (minAngleDiff < 10) {
    const length = Math.hypot(dx, dy)
    const snapAngleRad = nearestSnapAngle * Math.PI / 180
    const snappedXTemp = nearestStart.x + length * Math.cos(snapAngleRad)
    const snappedYTemp = nearestStart.y + length * Math.sin(snapAngleRad)
    const distToMouse = Math.hypot(snappedXTemp - current.x, snappedYTemp - current.y)
    if (distToMouse < 10) {
      angleSnapped = { x: snappedXTemp, y: snappedYTemp }
      angleDistance = distToMouse
    }
  }

  // 2. 计算点磁吸数据
  let pointSnapped: Point | null = null
  let pointDistance = Infinity

  for (const point of allPoints) {
    const dist = Math.hypot(current.x - point.x, current.y - point.y)
    // 排除与 nearestStart 完全重合的点
    if (dist < 10 && !(point.x === nearestStart.x && point.y === nearestStart.y)) {
      if (dist < pointDistance) {
        pointDistance = dist
        pointSnapped = { x: point.x, y: point.y }
      }
    }
  }

  // 3. 计算轴对齐磁吸数据
  // xAxisSnappedY: 命中的y坐标值（水平对齐，即y值与某个点一致）
  // yAxisSnappedX: 命中的x坐标值（垂直对齐，即x值与某个点一致）
  // xAxisDistance: 命中x轴对齐的最小距离
  // yAxisDistance: 命中y轴对齐的最小距离
  let xAxisSnappedYVal: number | null = null
  let yAxisSnappedXVal: number | null = null
  let xAxisDistance = Infinity
  let yAxisDistance = Infinity

  for (const point of allPoints) {
    const distToXAxis = Math.abs(current.y - point.y)
    if (distToXAxis < 10 && distToXAxis < xAxisDistance) {
      xAxisDistance = distToXAxis
      xAxisSnappedYVal = point.y
    }

    const distToYAxis = Math.abs(current.x - point.x)
    if (distToYAxis < 10 && distToYAxis < yAxisDistance) {
      yAxisDistance = distToYAxis
      yAxisSnappedXVal = point.x
    }
  }

  // 更新ref值用于绘制参考线
  xAxisSnappedY.value = xAxisSnappedYVal
  yAxisSnappedX.value = yAxisSnappedXVal

  // 二、按照优先级依次尝试命中

  // 1. 最高优先级：点磁吸
  if (pointSnapped) {
    snappedX = pointSnapped.x
    snappedY = pointSnapped.y
  }
  // 2. 第二优先级：角度+轴对齐组合（计算交点）
  else if (angleSnapped && (xAxisSnappedY.value !== null || yAxisSnappedX.value !== null)) {
    const angleRad = nearestSnapAngle * Math.PI / 180
    const k = Math.tan(angleRad)
    const b = angleSnapped.y - k * angleSnapped.x

    if (xAxisSnappedYVal !== null && yAxisSnappedXVal !== null) {
      // 同时命中x和y轴，计算角度线与两条轴对齐线的交点，选择更近的
      // 交点1：角度线与 x = yAxisSnappedXVal 的交点
      const intersect1Y = k * yAxisSnappedXVal + b
      const dist1 = Math.hypot(yAxisSnappedXVal - current.x, intersect1Y - current.y)

      // 交点2：角度线与 y = xAxisSnappedYVal 的交点
      let intersect2X
      if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
        intersect2X = angleSnapped.x
      } else if (Math.abs(angleRad) < 0.01 || Math.abs(angleRad - Math.PI) < 0.01 || Math.abs(angleRad + Math.PI) < 0.01) {
        intersect2X = xAxisSnappedYVal
      } else {
        intersect2X = (xAxisSnappedYVal - b) / k
      }
      const dist2 = Math.hypot(intersect2X - current.x, xAxisSnappedYVal - current.y)

      if (dist1 <= dist2) {
        snappedX = yAxisSnappedXVal
        snappedY = intersect1Y
      } else {
        snappedX = intersect2X
        snappedY = xAxisSnappedYVal
      }
    } else if (yAxisSnappedXVal !== null) {
      // 命中y轴对齐：交点是 (yAxisSnappedXVal, k * yAxisSnappedXVal + b)
      // 处理垂直线情况（90度或-90度）
      if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
        snappedX = yAxisSnappedXVal
        snappedY = angleSnapped.y
      } else {
        snappedX = yAxisSnappedXVal
        snappedY = k * yAxisSnappedXVal + b
      }
    } else if (xAxisSnappedYVal !== null) {
      // 命中x轴对齐：交点是 ((xAxisSnappedYVal - b) / k, xAxisSnappedYVal)
      // 处理水平线情况（0度或180度，k=0）和垂直线情况（90度或-90度）
      if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
        // 垂直线：x保持不变
        snappedX = current.x
      } else if (Math.abs(angleRad) < 0.01 || Math.abs(angleRad - Math.PI) < 0.01 || Math.abs(angleRad + Math.PI) < 0.01) {
        // 水平线：y保持为xAxisSnappedYVal，x使用angleSnapped.x
        snappedX = angleSnapped.x
      } else {
        snappedX = (xAxisSnappedYVal - b) / k
      }
      snappedY = xAxisSnappedYVal
    }
  }
  // 3. 第三优先级：单独角度磁吸
  else if (angleSnapped) {
    snappedX = angleSnapped.x
    snappedY = angleSnapped.y
  }
  // 4. 第四优先级：单独轴对齐磁吸
  else if (xAxisSnappedYVal !== null && yAxisSnappedXVal !== null) {
    console.log(13)
    snappedX = yAxisSnappedXVal
    snappedY = xAxisSnappedYVal
  } else if (yAxisSnappedXVal !== null) {
    snappedX = yAxisSnappedXVal
    snappedY = current.y
  } else if (xAxisSnappedYVal !== null) {
    snappedX = current.x
    snappedY = xAxisSnappedYVal
  }

  return { x: Math.round(snappedX), y: Math.round(snappedY) }
}

const drawWrapper = () => {
  const canvas = canvasRef.value
  if (canvas) {
    let draggedPointIdx: number | null = null
    let draggedWallIdx: number | null = null
    let draggedDoorIdx: number | null = null
    let draggedWindowIdx: number | null = null

    if (draggedPoint.value) {
      if (draggedPoint.value.type === 'wall') {
        draggedPointIdx = draggedPoint.value.pointIndex
        draggedWallIdx = draggedPoint.value.wallIndex
      } else if (draggedPoint.value.type === 'door') {
        draggedDoorIdx = draggedPoint.value.doorIndex
      } else if (draggedPoint.value.type === 'window') {
        draggedWindowIdx = draggedPoint.value.windowIndex
      }
    }

    draw(
      canvas,
      walls.value,
      doors.value,
      windows.value,
      tempWallPoints.value,
      hoverPoint.value,
      currentTool.value,
      getNearestWall,
      xAxisSnappedY.value,
      yAxisSnappedX.value,
      draggedPointIdx,
      draggedWallIdx,
      draggedDoorIdx,
      draggedWindowIdx,
      wallThickness,
      panOffset.value,
      canvasSize.value.width,
      canvasSize.value.height,
      zoomLevel.value
    )
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.canvas.width = canvasWidth
      ctx.canvas.height = canvasHeight
      drawWrapper()
    }

    window.addEventListener('resize', () => updateCanvasSize(true))
    updateCanvasSize()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (tempWallPoints.value.length > 0) {
          if (tempWallPoints.value.length > 1) {
            const newWall: Wall = {
              id: Date.now().toString(),
              points: [...tempWallPoints.value]
            }
            walls.value.push(newWall)
            history.value.push(JSON.parse(JSON.stringify(walls.value)))
          }
          tempWallPoints.value = []
          lastPoint.value = null
          hoverPoint.value = null
        }
        drawWrapper()
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
    zoomLevel: zoomLevel.value
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

  // 检查是否点击了门
  for (let i = 0; i < doors.value.length; i++) {
    const door = doors.value[i]
    const dist = Math.hypot(x - door.x, y - door.y)
    if (dist < 10) {
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
    doors.value.splice(contextMenu.value.index, 1)
  } else if (contextMenu.value.type === 'window') {
    windows.value.splice(contextMenu.value.index, 1)
  }

  contextMenu.value = null
  drawWrapper()
}

const handleCanvasClick = (e: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  // 如果当前是拖拽模式，不执行任何操作
  if (currentTool.value === 'drag') {
    return
  }

  if (currentTool.value === 'wall') {
    let clickPoint = { x, y }

    if (tempWallPoints.value.length > 0) {
      const last = tempWallPoints.value[tempWallPoints.value.length - 1]
      // 收集所有点（包括临时折线和已绘制的墙上的点）
      const allPoints = [...tempWallPoints.value]
      walls.value.forEach(wall => {
        wall.points.forEach(point => {
          allPoints.push(point)
        })
      })
      const snapped = getSnapPoint([last], clickPoint, allPoints)
      const dist = Math.hypot(snapped.x - last.x, snapped.y - last.y)

      if (dist < 10 * zoomLevel.value) {
        if (tempWallPoints.value.length > 1) {
          const newWall: Wall = {
            id: Date.now().toString(),
            points: [...tempWallPoints.value]
          }
          walls.value.push(newWall)
          history.value.push(JSON.parse(JSON.stringify(walls.value)))
          tempWallPoints.value = []
          lastPoint.value = null
        }
        return
      }

      clickPoint = snapped
    }

    tempWallPoints.value.push(clickPoint)
    lastPoint.value = clickPoint
  } else {
    const nearest = getNearestWall({ x, y })
    if (nearest) {
      if (currentTool.value === 'door') {
        const door: Door = {
          id: Date.now().toString(),
          wallId: nearest.wall.id,
          x: nearest.pointOnWall.x,
          y: nearest.pointOnWall.y,
          width: doorWidth,
          angle: nearest.angle
        }
        doors.value.push(door)
      } else if (currentTool.value === 'window') {
        const windowItem: Window = {
          id: Date.now().toString(),
          wallId: nearest.wall.id,
          x: nearest.pointOnWall.x,
          y: nearest.pointOnWall.y,
          width: windowWidth,
          angle: nearest.angle
        }
        windows.value.push(windowItem)
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
    tempWallPoints.value = []
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
  if (draggedPoint.value !== null) {
    const dragged = draggedPoint.value
    let originalPoint: Point = { x: 0, y: 0 }
    let prevPoint: Point | null = null
    let nextPoint: Point | null = null

    if (dragged.type === 'wall') {
      if (dragged.wallIndex === -1) {
        originalPoint = tempWallPoints.value[dragged.pointIndex]
        if (dragged.pointIndex > 0) {
          prevPoint = tempWallPoints.value[dragged.pointIndex - 1]
        }
        if (dragged.pointIndex < tempWallPoints.value.length - 1) {
          nextPoint = tempWallPoints.value[dragged.pointIndex + 1]
        }
      } else {
        originalPoint = walls.value[dragged.wallIndex].points[dragged.pointIndex]
        const wall = walls.value[dragged.wallIndex]
        if (dragged.pointIndex > 0) {
          prevPoint = wall.points[dragged.pointIndex - 1]
        }
        if (dragged.pointIndex < wall.points.length - 1) {
          nextPoint = wall.points[dragged.pointIndex + 1]
        }
      }
    } else if (dragged.type === 'door') {
      originalPoint = { x: doors.value[dragged.doorIndex].x, y: doors.value[dragged.doorIndex].y }
    } else if (dragged.type === 'window') {
      originalPoint = { x: windows.value[dragged.windowIndex].x, y: windows.value[dragged.windowIndex].y }
    }

    const allPoints = [...tempWallPoints.value]
    walls.value.forEach((wall) => {
      wall.points.forEach(point => {
        allPoints.push(point)
      })
    })
    doors.value.forEach((door, doorIdx) => {
      if (dragged.type !== 'door' || doorIdx !== dragged.doorIndex) {
        allPoints.push({ x: door.x, y: door.y })
      }
    })
    windows.value.forEach((win, winIdx) => {
      if (dragged.type !== 'window' || winIdx !== dragged.windowIndex) {
        allPoints.push({ x: win.x, y: win.y })
      }
    })

    const startPoints: Point[] = []
    if (prevPoint) startPoints.push(prevPoint)
    if (nextPoint) startPoints.push(nextPoint)
    if (startPoints.length === 0) startPoints.push(originalPoint)

    const targetX = x - (dragOffset.value?.x || 0)
    const targetY = y - (dragOffset.value?.y || 0)

    const snapped = getSnapPoint(startPoints, { x: targetX, y: targetY }, allPoints)
    const newX = snapped.x
    const newY = snapped.y

    if (dragged.type === 'wall') {
      if (dragged.wallIndex === -1) {
        tempWallPoints.value[dragged.pointIndex] = { x: newX, y: newY }
      } else {
        walls.value[dragged.wallIndex].points[dragged.pointIndex] = { x: newX, y: newY }
      }
    } else if (dragged.type === 'door') {
      const nearest = getNearestWall({ x: newX, y: newY })
      if (nearest) {
        doors.value[dragged.doorIndex].x = nearest.pointOnWall.x
        doors.value[dragged.doorIndex].y = nearest.pointOnWall.y
        doors.value[dragged.doorIndex].angle = nearest.angle
      }
    } else if (dragged.type === 'window') {
      const nearest = getNearestWall({ x: newX, y: newY })
      if (nearest) {
        windows.value[dragged.windowIndex].x = nearest.pointOnWall.x
        windows.value[dragged.windowIndex].y = nearest.pointOnWall.y
        windows.value[dragged.windowIndex].angle = nearest.angle
      }
    }
    drawWrapper()
    return
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
    if (tempWallPoints.value.length > 0) {
      const last = tempWallPoints.value[tempWallPoints.value.length - 1]
      const dist = Math.hypot(x - last.x, y - last.y)

      if (dist < snapThreshold) {
        hoverPoint.value = { ...last }
      } else {
        // 收集所有点（包括临时折线和已绘制的墙上的点）
        const allPoints = [...tempWallPoints.value]
        walls.value.forEach(wall => {
          wall.points.forEach(point => {
            allPoints.push(point)
          })
        })
        const snappedPoint = getSnapPoint([last], { x, y }, allPoints)
        hoverPoint.value = snappedPoint
      }
    }
  } else {
    const nearest = getNearestWall({ x, y })
    if (nearest) {
      hoverPoint.value = nearest.pointOnWall
    } else {
      hoverPoint.value = null
    }
  }

  drawWrapper()
}

const handleMouseDown = (e: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  // 只有在拖拽模式下才能拖拽点
  if (currentTool.value === 'drag') {
    // 检查临时折线上的点
    for (let i = 0; i < tempWallPoints.value.length; i++) {
      const point = tempWallPoints.value[i]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < wallThickness * zoomLevel.value) {
        draggedPoint.value = { type: 'wall', wallIndex: -1, pointIndex: i }
        dragOffset.value = { x: point.x - x, y: point.y - y }
        prevTool.value = currentTool.value
        drawWrapper()
        return
      }
    }

    // 检查已绘制的墙上的点
    walls.value.forEach((wall, wallIndex) => {
      wall.points.forEach((point, pointIndex) => {
        const dist = Math.hypot(x - point.x, y - point.y)
        if (dist < wallThickness * zoomLevel.value) {
          draggedPoint.value = { type: 'wall', wallIndex, pointIndex }
          dragOffset.value = { x: point.x - x, y: point.y - y }
          prevTool.value = currentTool.value
          drawWrapper()
        }
      })
    })

    // 检查门
    doors.value.forEach((door, doorIndex) => {
      const dist = Math.hypot(x - door.x, y - door.y)
      if (dist < wallThickness * zoomLevel.value) {
        draggedPoint.value = { type: 'door', doorIndex }
        dragOffset.value = { x: door.x - x, y: door.y - y }
        prevTool.value = currentTool.value
        drawWrapper()
      }
    })

    // 检查窗户
    windows.value.forEach((windowItem, windowIndex) => {
      const dist = Math.hypot(x - windowItem.x, y - windowItem.y)
      if (dist < wallThickness * zoomLevel.value) {
        draggedPoint.value = { type: 'window', windowIndex }
        dragOffset.value = { x: windowItem.x - x, y: windowItem.y - y }
        prevTool.value = currentTool.value
        drawWrapper()
      }
    })

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
  isSplitting.value = false
  document.body.style.cursor = 'default'
  updateCanvasSize(true)
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
