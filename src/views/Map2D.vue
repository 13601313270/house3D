<template>
  <div class="map2d-container">
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
      <button :class="{ active: currentTool === 'drag' }" @click="currentTool = 'drag'" type="button">
        拖拽
      </button>
    </div>

    <div class="canvas-container">
      <canvas ref="canvasRef" @click="handleCanvasClick" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
        @mouseup="handleMouseUp" class="drawing-canvas" />
    </div>

    <div class="info-panel">
      <div>当前模式: {{ currentTool }}</div>
      <div>墙面数量: {{ walls.length }}</div>
      <div>门数量: {{ doors.length }}</div>
      <div>窗户数量: {{ windows.length }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { Point, Wall, Door, Window } from '../types/map2d'
import { draw, drawPoint, drawEntity, drawPreviewEntity, canvasWidth, canvasHeight, snapThreshold, doorWidth, windowWidth, wallThickness } from '../utils/drawUtils'

const canvasRef = ref<HTMLCanvasElement | null>(null)
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
      wallThickness
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

const handleCanvasClick = (e: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = Math.round(e.clientX - rect.left)
  const y = Math.round(e.clientY - rect.top)

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

      if (dist < 10) {
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
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

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

    const dx = x - (originalPoint.x - (dragOffset.value?.x || 0))
    const dy = y - (originalPoint.y - (dragOffset.value?.y || 0))

    const snapped = getSnapPoint(startPoints, { x: originalPoint.x + dx, y: originalPoint.y + dy }, allPoints)
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
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // 只有在拖拽模式下才能拖拽点
  if (currentTool.value === 'drag') {
    // 检查临时折线上的点
    for (let i = 0; i < tempWallPoints.value.length; i++) {
      const point = tempWallPoints.value[i]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < wallThickness) {
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
        if (dist < wallThickness) {
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
      if (dist < wallThickness) {
        draggedPoint.value = { type: 'door', doorIndex }
        dragOffset.value = { x: door.x - x, y: door.y - y }
        prevTool.value = currentTool.value
        drawWrapper()
      }
    })

    // 检查窗户
    windows.value.forEach((windowItem, windowIndex) => {
      const dist = Math.hypot(x - windowItem.x, y - windowItem.y)
      if (dist < wallThickness) {
        draggedPoint.value = { type: 'window', windowIndex }
        dragOffset.value = { x: windowItem.x - x, y: windowItem.y - y }
        prevTool.value = currentTool.value
        drawWrapper()
      }
    })
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
}
</script>

<style scoped>
.map2d-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: #e4e6eb;
  cursor: pointer;
  font-size: 14px;
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
  margin-bottom: 20px;
}

.drawing-canvas {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
}

.info-panel {
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  color: #666;
}

.info-panel div {
  margin: 5px 0;
}
</style>
