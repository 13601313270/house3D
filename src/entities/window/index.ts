import { Point, Entity, HandelInfo } from '@/types/map2d'
import { EntityClass, EntityType } from '@/types/entity'
import { Window } from './index.d'

export class WindowEntity extends EntityClass {
  type: EntityType = 'window'
  window: Window

  constructor(window: Window) {
    super(window.id, window.x, window.y)
    this.window = window
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number
  ): void {
    const screenX = this.window.x * zoomLevel + panOffset.x
    const screenY = this.window.y * zoomLevel + panOffset.y

    const color = '#3498db'

    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(this.window.angle)

    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    const thickness = 10;//
    ctx.fillRect(-this.window.width / 2, -thickness / 2, this.window.width, thickness)
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
    const dist = Math.hypot(x - this.window.x, y - this.window.y)
    if (dist < this.window.width * zoomLevel) {
      return {
        id: this.id,
      }
    }
    return null;
  }

  draw3D(scene: any): void {
    // 实现窗户的3D绘制逻辑
  }

  onUpdateHandelInfoChange(matchHandelInfo: HandelInfo, newPosition: { x: number, y: number }) {
    this.window.x = newPosition.x
    this.window.y = newPosition.y
  }

  getBeSnapPoints(): Point[] {
    return [this.window]
  }

  getBeSnapLines(): [Point, Point][] {
    return []
  }

  afterBeSnapByLine(line: [Point, Point]) {
  }
}
