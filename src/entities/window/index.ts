import { Point, Entity, HandelInfo } from '@/types/map2d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { Window } from './index.d'

export class WindowEntity extends EntityClass<Window> {
  type: EntityType = 'window'
  width: number
  angle: number

  constructor(window: Window) {
    super(window)
    this.width = window.width
    this.angle = window.angle
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number
  ): void {
    const screenX = this.data.x * zoomLevel + panOffset.x
    const screenY = this.data.y * zoomLevel + panOffset.y

    const color = '#3498db'

    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(this.angle)

    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    const thickness = 10;//
    ctx.fillRect(-this.width / 2, -thickness / 2, this.width, thickness)
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.restore()

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number, zoomLevel: number): HandelInfo | null {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < this.width * zoomLevel) {
      return {
        index: 0,
        id: this.data.id,
        type: this.type,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
    this.changePosition({ x, y })
  }

  draw3D(scene: any): void {
    // 实现窗户的3D绘制逻辑
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    if (newPosition.objType === 'wall' && newPosition.snapFromType === 'line') {
      this.changePosition(newPosition.point)
      return true
    }
    return false
  }

  getMineBeSnapPoints() {
    const key: allSnapFromType = 'point';
    return [{
      objType: this.type,
      snapFromType: key,
      point: {
        index: 0,
        x: this.data.x,
        y: this.data.y,
      },
    }]
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  afterBeSnapByLine(obj: { type: EntityType }, line: [Point, Point]) {
    if (obj.type === 'wall') {
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      this.data.angle = nearestAngle
    }
  }
}
