import { Point, Entity, HandelInfo, PointWithIndex } from '@/types/map2d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
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
        const isDragged = false;// pointIndex === draggedPointIndex
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
          index: i,
        }
      }
    }
    return null
  }

  matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo) {
    if (matchHandelInfo.index !== undefined) {
      this.wall.points[matchHandelInfo.index] = { x, y }
    }
  }

  inSceneSnapPointArea(
    newPosition: MatchSnapPoint,
    dragHandelInfo: HandelInfo
  ) {
    if (newPosition.snapFromType === 'point') {
      // 暂时没有考虑好怎么写磁吸到边的情况，因为暂时无法排除自己，所以只命中point磁吸
      // console.log('MatchSnapPoint-3', newPosition.point, dragHandelInfo.index)
      this.wall.points[dragHandelInfo.index] = newPosition.point
      return true
    }
    return false;
  }

  getMineBeSnapPoints() {
    const key: allSnapFromType = 'point';
    return this.wall.points.map((v, index: number) => {
      return {
        objType: this.type,
        snapFromType: key,
        point: { ...v, index },
      }
    })
  }

  getMineBeSnapLines(): Array<[Point, Point]> {
    const lines: Array<[Point, Point]> = []
    for (let i = 0; i < this.wall.points.length - 1; i++) {
      const p1 = this.wall.points[i]
      const p2 = this.wall.points[i + 1]
      lines.push([p1, p2])
    }
    return lines;
  }

  afterBeSnapByLine(obj: { type: EntityType }, line: [Point, Point]) {
  }
}
