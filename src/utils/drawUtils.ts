import { Point } from '../types'
import { Wall } from '@/entities/wall/index.d'
import { Door } from '@/entities/door/index.d'
import { Window } from '@/entities/window/index.d'
import { Walls } from '@/entities/wall/index'
import { DoorEntity } from '@/entities/door'
import { WindowEntity } from '@/entities/window'

export const canvasWidth = 800
export const canvasHeight = 600
export const snapThreshold = 20
export const doorWidth = 90
export const windowWidth = 120

export const drawPreviewEntity = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  angle: number,
  color: string,
  type: 'door' | 'window',
  thickness: number = 10
) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([8, 4])

  if (type === 'door') {
    ctx.beginPath()
    ctx.moveTo(-width / 2, -thickness)
    ctx.lineTo(-width / 2, thickness)
    ctx.lineTo(0, thickness * 2)
    ctx.lineTo(width / 2, thickness)
    ctx.lineTo(width / 2, -thickness)
    ctx.closePath()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(-width / 2, -thickness / 2)
    ctx.lineTo(-width / 2, thickness / 2)
    ctx.lineTo(width / 2, thickness / 2)
    ctx.lineTo(width / 2, -thickness / 2)
    ctx.closePath()
    ctx.stroke()
  }

  ctx.restore()
}

export const draw = (
  canvasRef: HTMLCanvasElement | null,
  walls: Wall[],
  doors: Door[],
  windows: Window[],
  tempWallPoints: Point[],
  hoverPoint: Point | null,
  currentTool: string,
  getNearestWall: (point: Point) => { wall: Wall; pointOnWall: Point; angle: number } | null,
  xAxisSnappedY: number | null,
  yAxisSnappedX: number | null,
  draggedPointIndex: number | null,
  draggedWallIndex: number | null,
  panOffset: Point = { x: 0, y: 0 },
  canvasWidth: number = 800,
  canvasHeight: number = 600,
  zoomLevel: number = 1
) => {
  if (!canvasRef) return
  const ctx = canvasRef.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  // 绘制墙体
  const WallEntityApi = new Walls(walls)
  WallEntityApi.draw2D(
    ctx,
    panOffset,
    zoomLevel,
    currentTool,
    tempWallPoints,
    draggedWallIndex,
    draggedPointIndex,
    hoverPoint,
  )
  doors.forEach((door) => {
    const doorApi = new DoorEntity(door)
    doorApi.draw2D(ctx, panOffset, zoomLevel)
  })

  windows.forEach((win) => {
    const windowApi = new WindowEntity(win)
    windowApi.draw2D(ctx, panOffset, zoomLevel)
  })

  doors.forEach((door) => {
    const screenX = door.x * zoomLevel + panOffset.x
    const screenY = door.y * zoomLevel + panOffset.y
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  windows.forEach((win) => {
    const screenX = win.x * zoomLevel + panOffset.x
    const screenY = win.y * zoomLevel + panOffset.y
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  if (hoverPoint && currentTool !== 'wall') {
    const hoverScreenX = hoverPoint.x * zoomLevel + panOffset.x
    const hoverScreenY = hoverPoint.y * zoomLevel + panOffset.y
    const nearestWall = getNearestWall(hoverPoint)
    if (nearestWall) {
      const { pointOnWall, angle } = nearestWall
      const wallScreenX = pointOnWall.x * zoomLevel + panOffset.x
      const wallScreenY = pointOnWall.y * zoomLevel + panOffset.y
      const wallThickness = nearestWall.wall.thickness || 0;
      if (currentTool === 'door') {
        drawPreviewEntity(ctx, wallScreenX, wallScreenY, doorWidth * zoomLevel, angle, '#e67e22', 'door', wallThickness * zoomLevel)
      } else if (currentTool === 'window') {
        drawPreviewEntity(ctx, wallScreenX, wallScreenY, windowWidth * zoomLevel, angle, '#3498db', 'window', wallThickness * zoomLevel)
      }
    }
  }

  // 绘制轴对齐参考线
  if (hoverPoint) {
    const hoverScreenX = hoverPoint.x * zoomLevel + panOffset.x
    const hoverScreenY = hoverPoint.y * zoomLevel + panOffset.y
    ctx.strokeStyle = '#999'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])

    // 垂直线（y轴对齐）
    if (yAxisSnappedX !== null) {
      const screenX = yAxisSnappedX * zoomLevel + panOffset.x
      ctx.beginPath()
      ctx.moveTo(screenX, 0)
      ctx.lineTo(screenX, canvasHeight)
      ctx.stroke()
    }

    // 水平线（x轴对齐）
    if (xAxisSnappedY !== null) {
      const screenY = xAxisSnappedY * zoomLevel + panOffset.y
      ctx.beginPath()
      ctx.moveTo(0, screenY)
      ctx.lineTo(canvasWidth, screenY)
      ctx.stroke()
    }
  }
}
