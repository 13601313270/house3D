import { Wall, Door, Window, Point } from '../types/map2d'

export const canvasWidth = 800
export const canvasHeight = 600
export const snapThreshold = 20
export const doorWidth = 90
export const windowWidth = 120

export const calculateAngle = (p1: Point, p2: Point, p3: Point): { angle: number; isConvex: boolean } | null => {
  const v1x = p1.x - p2.x
  const v1y = p1.y - p2.y
  const v2x = p3.x - p2.x
  const v2y = p3.y - p2.y
  
  const dot = v1x * v2x + v1y * v2y
  const len1 = Math.hypot(v1x, v1y)
  const len2 = Math.hypot(v2x, v2y)
  
  if (len1 === 0 || len2 === 0) return null
  
  const cosAngle = dot / (len1 * len2)
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI
  
  // 计算叉积判断凹凸性
  const cross = v1x * v2y - v1y * v2x
  const isConvex = cross > 0
  
  return { angle, isConvex }
}

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
  currentTool: string,
  getNearestWall: (point: Point) => { wall: Wall; pointOnWall: Point; angle: number } | null,
  xAxisSnappedY: number | null,
  yAxisSnappedX: number | null,
  draggedPointIndex: number | null,
  draggedWallIndex: number | null
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
    
    // 绘制墙上的点
    wall.points.forEach((point, pointIndex) => {
      const isDragged = draggedWallIndex !== null && draggedWallIndex === walls.indexOf(wall) && pointIndex === draggedPointIndex
      drawPoint(ctx, point.x, point.y, isDragged ? '#1890ff' : '#333')
      if (isDragged) {
        ctx.strokeStyle = '#1890ff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(point.x, point.y, 12, 0, Math.PI * 2)
        ctx.stroke()
      }
    })
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
      const isDragged = index === draggedPointIndex
      drawPoint(ctx, point.x, point.y, isDragged ? '#1890ff' : '#42b983')
      if (isDragged) {
        ctx.strokeStyle = '#1890ff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(point.x, point.y, 12, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (index > 0) {
        const prev = tempWallPoints[index - 1]
        ctx.fillStyle = isDragged ? '#1890ff' : '#42b983'
        ctx.font = '12px Arial'
        const dist = Math.round(Math.hypot(point.x - prev.x, point.y - prev.y))
        const midX = (point.x + prev.x) / 2
        const midY = (point.y + prev.y) / 2
        ctx.fillText(`${dist}px`, midX, midY - 5)
        
        // 绘制角度标记
        if (index > 1) {
          const prev2 = tempWallPoints[index - 2]
          const angleResult = calculateAngle(prev2, prev, point)
          if (angleResult !== null) {
            const { angle, isConvex } = angleResult
            const angleText = `${Math.round(angle)}°`
            // 计算角度文本位置：在夹角内侧
            // 如果夹角太小（< 30度），显示在外侧；否则显示在内侧
            const offset = angle < 30 ? 15 : -15
            const angleX = prev.x - 10
            const angleY = prev.y + offset
            ctx.fillStyle = '#42b983'
            ctx.fillText(angleText, angleX, angleY)
          }
        }
      }
    })

    if (hoverPoint) {
      drawPoint(ctx, hoverPoint.x, hoverPoint.y, '#42b983')
      // 绘制最后一个转角的角度标记
      if (tempWallPoints.length > 1) {
        const last = tempWallPoints[tempWallPoints.length - 1]
        const angleResult = calculateAngle(tempWallPoints[tempWallPoints.length - 2], last, hoverPoint)
        if (angleResult !== null) {
          const { angle } = angleResult
          const angleText = `${Math.round(angle)}°`
          // 计算角度文本位置：在夹角内侧
          // 如果夹角太小（< 30度），显示在外侧；否则显示在内侧
          const offset = angle < 30 ? 15 : -15
          const angleX = last.x - 10
          const angleY = last.y + offset
          ctx.fillText(angleText, angleX, angleY)
        }
      }
    }
  }

  doors.forEach((door) => {
    drawEntity(ctx, door.x, door.y, door.width, door.angle, '#e67e22', 'door')
  })

  windows.forEach((win) => {
    drawEntity(ctx, win.x, win.y, win.width, win.angle, '#3498db', 'window')
  })

  if (hoverPoint && currentTool !== 'wall') {
    const nearestWall = getNearestWall(hoverPoint)
    if (nearestWall) {
      const { pointOnWall, angle } = nearestWall
      if (currentTool === 'door') {
        drawPreviewEntity(ctx, pointOnWall.x, pointOnWall.y, doorWidth, angle, '#e67e22', 'door')
      } else if (currentTool === 'window') {
        drawPreviewEntity(ctx, pointOnWall.x, pointOnWall.y, windowWidth, angle, '#3498db', 'window')
      }
    }
  }

  // 绘制轴对齐参考线
  if (hoverPoint) {
    ctx.strokeStyle = '#999'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    
    // 垂直线（y轴对齐）
    if (yAxisSnappedX !== null) {
      ctx.beginPath()
      ctx.moveTo(yAxisSnappedX, 0)
      ctx.lineTo(yAxisSnappedX, canvasHeight)
      ctx.stroke()
    }
    
    // 水平线（x轴对齐）
    if (xAxisSnappedY !== null) {
      ctx.beginPath()
      ctx.moveTo(0, xAxisSnappedY)
      ctx.lineTo(canvasWidth, xAxisSnappedY)
      ctx.stroke()
    }
  }
}
