import { Point, Entity, HandelInfo } from '@/types/map2d'
import { EntityClass, EntityType } from '@/types/entity'
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
  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < this.width * zoomLevel) {
      return {
        id: this.data.id,
        type: this.type,
      }
    }
    return null;
  }

  draw3D(scene: any): void {
    // 实现窗户的3D绘制逻辑
  }

  onUpdateHandelInfoChange(matchHandelInfo: HandelInfo, newPosition: { x: number, y: number }) {
    this.data.x = newPosition.x
    this.data.y = newPosition.y
  }

  getBeSnapPoints(): Point[] {
    return [{
      x: this.data.x,
      y: this.data.y,
    }]
  }

  getBeSnapLines(): [Point, Point][] {
    return []
  }

  afterBeSnapByLine(line: [Point, Point]) {
  }
}
