import { Point } from '../types'
import { Wall } from '@/entities/wall/index.d'
import { Door } from '@/entities/door/index.d'
import { Window } from '@/entities/window/index.d'
import { WallEntity } from '@/entities/wall/index'
import { DoorEntity } from '@/entities/door'
import { WindowEntity } from '@/entities/window'

export const canvasWidth = 800
export const canvasHeight = 600
export const snapThreshold = 20
export const doorWidth = 90
export const windowWidth = 120

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
  // const WallEntityApi = new Walls(walls)
  // WallEntityApi.draw2D(
  //   ctx,
  //   panOffset,
  //   zoomLevel,
  //   currentTool,
  //   tempWallPoints,
  //   draggedWallIndex,
  //   draggedPointIndex,
  //   hoverPoint,
  // )
  walls.forEach(wall => {
    const wallApi = new WallEntity(wall)
    wallApi.draw2D(ctx, panOffset, zoomLevel, draggedWallIndex, draggedPointIndex, currentTool, tempWallPoints, hoverPoint)
  })

  doors.forEach((door) => {
    const doorApi = new DoorEntity(door)
    const wallThickness = walls.find((wall) => wall.id === door.wallId)?.thickness || 0;
    doorApi.draw2D(ctx, panOffset, wallThickness, zoomLevel)
  })

  windows.forEach((win) => {
    const windowApi = new WindowEntity(win)
    windowApi.draw2D(ctx, panOffset, zoomLevel)
  })

  if (hoverPoint && currentTool !== 'wall') {
    const nearestWall = getNearestWall(hoverPoint)
    if (nearestWall) {
      const { pointOnWall, angle } = nearestWall
      const wallScreenX = pointOnWall.x * zoomLevel + panOffset.x
      const wallScreenY = pointOnWall.y * zoomLevel + panOffset.y
      const wallThickness = nearestWall.wall.thickness || 0;
      // 鼠标悬浮
      if (currentTool === 'door') {
        const door = {
          id: '123',
          wallId: nearestWall.wall.id,
          x: wallScreenX,
          y: wallScreenY,
          width: doorWidth,
          angle,
        }
        const doorApi = new DoorEntity(door)
        doorApi.draw2D(ctx, panOffset, wallThickness, zoomLevel)
      } else if (currentTool === 'window') {
        const window = {
          id: '123',
          wallId: nearestWall.wall.id,
          x: wallScreenX,
          y: wallScreenY,
          width: windowWidth,
          angle,
        }
        const windowApi = new WindowEntity(window)
        windowApi.draw2D(ctx, panOffset, zoomLevel)
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
