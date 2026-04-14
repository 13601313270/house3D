import { Point } from '../types'
import { Wall } from '@/entities/wall/index.d'
import { Door } from '@/entities/door/index.d'
import { Window } from '@/entities/window/index.d'
import { WallEntity } from '@/entities/wall/index'
import { DoorEntity } from '@/entities/door'
import { WindowEntity } from '@/entities/window'
import { drawPoint } from './drawPoint'
import { calculateAngle } from './calculateAngle'

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
    wallApi.draw2D(ctx, panOffset, zoomLevel, currentTool, tempWallPoints, hoverPoint)
  })

  if (currentTool === 'wall' && tempWallPoints.length > 0) {
    ctx.strokeStyle = '#42b983'
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(tempWallPoints[0].x * zoomLevel + panOffset.x, tempWallPoints[0].y * zoomLevel + panOffset.y)
    for (let i = 1; i < tempWallPoints.length; i++) {
      ctx.lineTo(tempWallPoints[i].x * zoomLevel + panOffset.x, tempWallPoints[i].y * zoomLevel + panOffset.y)
    }
    if (hoverPoint) {
      ctx.lineTo(hoverPoint.x * zoomLevel + panOffset.x, hoverPoint.y * zoomLevel + panOffset.y)
    }
    ctx.stroke()

    tempWallPoints.forEach((point, index) => {
      const screenX = point.x * zoomLevel + panOffset.x
      const screenY = point.y * zoomLevel + panOffset.y
      const isDragged = false;// index === draggedPointIndex
      drawPoint(ctx, screenX, screenY, isDragged ? '#1890ff' : '#42b983')
      if (isDragged) {
        ctx.strokeStyle = '#1890ff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(screenX, screenY, 12 * zoomLevel, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (index > 0) {
        const prev = tempWallPoints[index - 1]
        const prevScreenX = prev.x * zoomLevel + panOffset.x
        const prevScreenY = prev.y * zoomLevel + panOffset.y
        ctx.fillStyle = isDragged ? '#1890ff' : '#42b983'
        ctx.font = '12px Arial'
        const dist = Math.round(Math.hypot(point.x - prev.x, point.y - prev.y))
        const midX = (screenX + prevScreenX) / 2
        const midY = (screenY + prevScreenY) / 2
        ctx.fillText(`${dist}px`, midX, midY - 5)

        // 绘制角度标记
        if (index > 1) {
          const prev2 = tempWallPoints[index - 2]
          const prev2ScreenX = prev2.x * zoomLevel + panOffset.x
          const prev2ScreenY = prev2.y * zoomLevel + panOffset.y
          const angleResult = calculateAngle({ x: prev2ScreenX, y: prev2ScreenY }, { x: prevScreenX, y: prevScreenY }, { x: screenX, y: screenY })
          if (angleResult !== null) {
            const { angle } = angleResult
            const angleText = `${Math.round(angle)}°`
            // 计算角度文本位置：在夹角内侧
            // 如果夹角太小（< 30度），显示在外侧；否则显示在内侧
            const offset = angle < 30 ? 15 : -15
            const angleX = prevScreenX - 10
            const angleY = prevScreenY + offset
            ctx.fillStyle = '#42b983'
            ctx.fillText(angleText, angleX, angleY)
          }
        }
      }
    })

    if (hoverPoint) {
      const hoverScreenX = hoverPoint.x * zoomLevel + panOffset.x
      const hoverScreenY = hoverPoint.y * zoomLevel + panOffset.y
      drawPoint(ctx, hoverScreenX, hoverScreenY, '#42b983')
      // 绘制最后一个转角的角度标记
      if (tempWallPoints.length > 1) {
        const last = tempWallPoints[tempWallPoints.length - 1]
        const lastScreenX = last.x * zoomLevel + panOffset.x
        const lastScreenY = last.y * zoomLevel + panOffset.y
        const angleResult = calculateAngle({ x: lastScreenX, y: lastScreenY }, { x: lastScreenX, y: lastScreenY }, { x: hoverScreenX, y: hoverScreenY })
        if (angleResult !== null) {
          const { angle } = angleResult
          const angleText = `${Math.round(angle)}°`
          // 计算角度文本位置：在夹角内侧
          // 如果夹角太小（< 30度），显示在外侧；否则显示在内侧
          const offset = angle < 30 ? 15 : -15
          const angleX = lastScreenX - 10
          const angleY = lastScreenY + offset
          ctx.fillText(angleText, angleX, angleY)
        }
      }
    }
  }

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
