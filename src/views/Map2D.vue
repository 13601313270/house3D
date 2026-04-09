<template>
  <div class="map2d-container">
    <div class="toolbar">
      <button 
        :class="{ active: currentTool === 'wall' }" 
        @click="currentTool = 'wall'"
        type="button"
      >
        墙面
      </button>
      <button 
        :class="{ active: currentTool === 'door' }" 
        @click="currentTool = 'door'"
        type="button"
      >
        门
      </button>
      <button 
        :class="{ active: currentTool === 'window' }" 
        @click="currentTool = 'window'"
        type="button"
      >
        窗户
      </button>
      <button @click="clearDrawing" type="button">
        清空
      </button>
      <button @click="undo" type="button">
        撤销
      </button>
    </div>
    
    <div class="canvas-container">
      <canvas 
        ref="canvasRef" 
        @click="handleCanvasClick"
        @mousemove="handleMouseMove"
        class="drawing-canvas"
      />
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
import { draw, drawPoint, drawEntity, drawPreviewEntity, canvasWidth, canvasHeight, snapThreshold, doorWidth, windowWidth } from '../utils/drawUtils'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentTool = ref<'wall' | 'door' | 'window'>('wall')
const walls = ref<Wall[]>([])
const doors = ref<Door[]>([])
const windows = ref<Window[]>([])
const tempWallPoints = ref<Point[]>([])
const hoverPoint = ref<Point | null>(null)
const lastPoint = ref<Point | null>(null)
const history = ref<Wall[][]>([])

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

const getSnapPoint = (start: Point, current: Point): Point => {
  const dx = current.x - start.x
  const dy = current.y - start.y
  const angle = Math.atan2(dy, dx)
  const angleDeg = angle * 180 / Math.PI
  
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
    const snappedXTemp = start.x + length * Math.cos(snapAngleRad)
    const snappedYTemp = start.y + length * Math.sin(snapAngleRad)
    const distToMouse = Math.hypot(snappedXTemp - current.x, snappedYTemp - current.y)
    if (distToMouse < 10) {
      angleSnapped = { x: snappedXTemp, y: snappedYTemp }
      angleDistance = distToMouse
    }
  }
  
  // 2. 计算点磁吸数据
  let pointSnapped: Point | null = null
  let pointDistance = Infinity
  
  for (const point of tempWallPoints.value) {
    const dist = Math.hypot(current.x - point.x, current.y - point.y)
    if (dist < 10 && (point.x !== start.x || point.y !== start.y)) {
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
  let xAxisSnappedY: number | null = null
  let yAxisSnappedX: number | null = null
  let xAxisDistance = Infinity
  let yAxisDistance = Infinity
  
  for (const point of tempWallPoints.value) {
    if (point.x !== start.x || point.y !== start.y) {
      const distToXAxis = Math.abs(current.y - point.y)
      if (distToXAxis < 10 && distToXAxis < xAxisDistance) {
        xAxisDistance = distToXAxis
        xAxisSnappedY = point.y
      }
      
      const distToYAxis = Math.abs(current.x - point.x)
      if (distToYAxis < 10 && distToYAxis < yAxisDistance) {
        yAxisDistance = distToYAxis
        yAxisSnappedX = point.x
      }
    }
  }
  
  // 二、按照优先级依次尝试命中
  
  // 1. 最高优先级：点磁吸
  if (pointSnapped) {
    snappedX = pointSnapped.x
    snappedY = pointSnapped.y
  }
  // 2. 第二优先级：角度+轴对齐组合（计算交点）
  else if (angleSnapped && (xAxisSnappedY !== null || yAxisSnappedX !== null)) {
    const angleRad = nearestSnapAngle * Math.PI / 180
    const k = Math.tan(angleRad)
    const b = angleSnapped.y - k * angleSnapped.x
    
    if (xAxisSnappedY !== null && yAxisSnappedX !== null) {
      // 同时命中x和y轴，计算角度线与两条轴对齐线的交点，选择更近的
      // 交点1：角度线与 x = yAxisSnappedX 的交点
      const intersect1Y = k * yAxisSnappedX + b
      const dist1 = Math.hypot(yAxisSnappedX - current.x, intersect1Y - current.y)
      
      // 交点2：角度线与 y = xAxisSnappedY 的交点
      let intersect2X
      if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
        intersect2X = angleSnapped.x
      } else {
        intersect2X = (xAxisSnappedY - b) / k
      }
      const dist2 = Math.hypot(intersect2X - current.x, xAxisSnappedY - current.y)
      
      if (dist1 <= dist2) {
        snappedX = yAxisSnappedX
        snappedY = intersect1Y
      } else {
        snappedX = intersect2X
        snappedY = xAxisSnappedY
      }
    } else if (yAxisSnappedX !== null) {
      console.log(1)
      // 命中y轴对齐：交点是 (yAxisSnappedX, k * yAxisSnappedX + b)
      // 处理垂直线情况（90度或-90度）
      if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
        snappedX = yAxisSnappedX
        snappedY = angleSnapped.y
      } else {
        snappedX = yAxisSnappedX
        snappedY = k * yAxisSnappedX + b
      }
    } else if (xAxisSnappedY !== null) {
      // 命中x轴对齐：交点是 ((xAxisSnappedY - b) / k, xAxisSnappedY)
      // 处理水平线情况（0度或180度，k=0）和垂直线情况（90度或-90度）
      if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
        // 垂直线：x保持不变
        snappedX = current.x
      } else if (Math.abs(angleRad) < 0.01 || Math.abs(angleRad - Math.PI) < 0.01 || Math.abs(angleRad + Math.PI) < 0.01) {
        // 水平线：y保持为xAxisSnappedY，x使用angleSnapped.x
        snappedX = angleSnapped.x
      } else {
        snappedX = (xAxisSnappedY - b) / k
      }
      snappedY = xAxisSnappedY
    }
  }
  // 3. 第三优先级：单独角度磁吸
  else if (angleSnapped) {
    snappedX = angleSnapped.x
    snappedY = angleSnapped.y
  }
  // 4. 第四优先级：单独轴对齐磁吸
  else if (xAxisSnappedY !== null && yAxisSnappedX !== null) {
    if (xAxisDistance <= yAxisDistance) {
      snappedX = yAxisSnappedX
      snappedY = xAxisSnappedY
    } else {
      snappedX = yAxisSnappedX
      snappedY = xAxisSnappedY
    }
  } else if (yAxisSnappedX !== null) {
    snappedX = yAxisSnappedX
    snappedY = current.y
  } else if (xAxisSnappedY !== null) {
    snappedX = current.x
    snappedY = xAxisSnappedY
  }
  
  return { x: Math.round(snappedX), y: Math.round(snappedY) }
}

const drawWrapper = () => {
  const canvas = canvasRef.value
  if (canvas) {
    draw(canvas, walls.value, doors.value, windows.value, tempWallPoints.value, hoverPoint.value, currentTool.value, getNearestWall)
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
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (currentTool.value === 'wall') {
    let clickPoint = { x, y }
    
    if (tempWallPoints.value.length > 0) {
      const last = tempWallPoints.value[tempWallPoints.value.length - 1]
      const snapped = getSnapPoint(last, clickPoint)
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

const handleMouseMove = (e: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (currentTool.value === 'wall') {
    if (tempWallPoints.value.length > 0) {
      const last = tempWallPoints.value[tempWallPoints.value.length - 1]
      const dist = Math.hypot(x - last.x, y - last.y)
      
      if (dist < snapThreshold) {
        hoverPoint.value = { ...last }
      } else {
        const snappedPoint = getSnapPoint(last, { x, y })
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
