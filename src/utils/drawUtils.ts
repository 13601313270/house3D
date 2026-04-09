import { Wall, Door, Window, Point } from '../types/map2d'

export const canvasWidth = 800
export const canvasHeight = 600
export const snapThreshold = 20
export const doorWidth = 90
export const windowWidth = 120

export const drawPoint = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) => {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
}

export const drawEntity = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  angle: number,
  color: string,
  type: 'door' | 'window'
) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = 3

  if (type === 'door') {
    ctx.fillRect(-width / 2, -3, width, 6)
    ctx.beginPath()
    ctx.arc(0, 0, width / 2, -Math.PI / 4, Math.PI / 4)
    ctx.stroke()
  } else {
    ctx.fillRect(-width / 2, -3, width, 6)
    ctx.setLineDash([5, 5])
    ctx.stroke()
  }

  ctx.restore()
}

export const drawPreviewEntity = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  angle: number,
  color: string,
  type: 'door' | 'window'
) => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([8, 4])

  if (type === 'door') {
    ctx.beginPath()
    ctx.moveTo(-width / 2, -10)
    ctx.lineTo(-width / 2, 10)
    ctx.lineTo(0, 20)
    ctx.lineTo(width / 2, 10)
    ctx.lineTo(width / 2, -10)
    ctx.closePath()
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(-width / 2, -5)
    ctx.lineTo(-width / 2, 5)
    ctx.lineTo(width / 2, 5)
    ctx.lineTo(width / 2, -5)
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
  currentTool: string
) => {
  if (!canvasRef) return
  const ctx = canvasRef.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.setLineDash([])

  walls.forEach((wall) => {
    if (wall.points.length < 2) return
    ctx.beginPath()
    ctx.moveTo(wall.points[0].x, wall.points[0].y)
    for (let i = 1; i < wall.points.length; i++) {
      ctx.lineTo(wall.points[i].x, wall.points[i].y)
    }
    ctx.stroke()
  })

  if (currentTool === 'wall' && tempWallPoints.length > 0) {
    ctx.strokeStyle = '#42b983'
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(tempWallPoints[0].x, tempWallPoints[0].y)
    for (let i = 1; i < tempWallPoints.length; i++) {
      ctx.lineTo(tempWallPoints[i].x, tempWallPoints[i].y)
    }
    if (hoverPoint) {
      ctx.lineTo(hoverPoint.x, hoverPoint.y)
    }
    ctx.stroke()

    tempWallPoints.forEach((point, index) => {
      drawPoint(ctx, point.x, point.y, '#42b983')
      if (index > 0) {
        const prev = tempWallPoints[index - 1]
        ctx.fillStyle = '#42b983'
        ctx.font = '12px Arial'
        const dist = Math.round(Math.hypot(point.x - prev.x, point.y - prev.y))
        const midX = (point.x + prev.x) / 2
        const midY = (point.y + prev.y) / 2
        ctx.fillText(`${dist}px`, midX, midY - 5)
      }
    })

    if (hoverPoint) {
      drawPoint(ctx, hoverPoint.x, hoverPoint.y, '#42b983')
    }
  }

  doors.forEach((door) => {
    drawEntity(ctx, door.x, door.y, door.width, door.angle, '#e67e22', 'door')
  })

  windows.forEach((win) => {
    drawEntity(ctx, win.x, win.y, win.width, win.angle, '#3498db', 'window')
  })

  if (hoverPoint && currentTool !== 'wall') {
    // 这里需要传入 getNearestWall 函数，或者将逻辑移到这里
    // 暂时保留占位
  }
}
