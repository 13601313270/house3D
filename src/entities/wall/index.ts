import { Point, Entity, HandelInfo } from '@/types/map2d'
import { EntityClass, EntityType } from '@/types/entity'
import { Wall } from './index.d'
import { drawPoint } from '@/utils/drawPoint'
import { createShapeFromPoints } from '@/utils/createShapeFromPoints'
import { calculateAngle } from '@/utils/calculateAngle'
import pointToLineDistance from '@/utils/pointToLineDistance'

export class WallEntity extends EntityClass<Wall> {
  type: EntityType = 'wall'
  points: Point[]
  thickness: number
  wall: Wall

  constructor(wall: Wall) {
    super(wall)
    this.wall = wall
    this.points = wall.points
    this.thickness = wall.thickness
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number,
    draggedWallIndex: number | null,
    draggedPointIndex: number | null,
    currentTool: string,
    tempWallPoints: Point[],
    hoverPoint: Point | null,
  ): void {
    const margineds = createShapeFromPoints([this.wall]);

    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    ctx.setLineDash([])
    ctx.beginPath();

    for (const poly of margineds || []) {
      for (let i = 0; i < poly.length; i++) {
        const ring = poly[i] as any
        for (let j = 0; j < ring.length; j++) {
          if (ring[j] === null) continue
          const screenX = ring[j][0] * zoomLevel + panOffset.x
          const screenY = ring[j][1] * zoomLevel + panOffset.y
          if (j === 0) {
            // @ts-ignore
            ctx.moveTo(screenX, screenY);
          } else {
            // @ts-ignore
            ctx.lineTo(screenX, screenY);
          }
        }
      }
      ctx.closePath();
    }
    ctx.stroke();
    // 绘制墙上的点
    [this.wall].forEach((wall) => {
      if (wall.points.length < 2) return
      wall.points.forEach((point: Point, pointIndex: number) => {
        const screenX = point.x * zoomLevel + panOffset.x
        const screenY = point.y * zoomLevel + panOffset.y
        const isDragged = draggedWallIndex !== null && draggedWallIndex === [this.wall].indexOf(wall) && pointIndex === draggedPointIndex
        drawPoint(ctx, screenX, screenY, isDragged ? '#1890ff' : '#333')
        if (isDragged) {
          ctx.strokeStyle = '#1890ff'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(screenX, screenY, 12 * zoomLevel, 0, Math.PI * 2)
          ctx.stroke()
        }
      })
    });

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
        const isDragged = index === draggedPointIndex
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
  }

  draw3D(scene: any): void {
    // 实现墙体的3D绘制逻辑
  }

  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    for (let i = 0; i < this.wall.points.length; i++) {
      const point = this.wall.points[i]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < this.thickness * zoomLevel) {
        // draggedPoint.value = { type: 'wall', wallIndex, pointIndex }
        // dragOffset.value = { x: point.x - x, y: point.y - y }
        // prevTool.value = currentTool.value
        // drawWrapper()
        return {
          id: this.data.id,
          type: this.type,
          info: { pointIndex: i }
        }
      }
    }
    return null
  }

  onUpdateHandelInfoChange(
    newPosition: { type: EntityType, point: Point },
    matchHandelInfo: HandelInfo
  ) {
    if (matchHandelInfo.info.pointIndex > -1) {
      this.wall.points[matchHandelInfo.info.pointIndex] = newPosition.point
    }
    // const { pointIndex } = handelInfo.info as { pointIndex: number }
    // const point = this.wall.points[pointIndex]
    // point.x = this.x + dragOffset.value.x
    // this.wall.points[pointIndex] = point
  }

  getBeSnapPoints() {
    return this.wall.points.map(v => {
      return {
        type: this.type,
        point: v,
      }
    })
  }

  getBeSnapLines(): Array<[Point, Point]> {
    const lines: Array<[Point, Point]> = []
    for (let i = 0; i < this.wall.points.length - 1; i++) {
      const p1 = this.wall.points[i]
      const p2 = this.wall.points[i + 1]
      lines.push([p1, p2])
    }
    return lines;
  }

  afterBeSnapByLine(line: [Point, Point]) {
  }
}
