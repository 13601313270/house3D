import { Point, Entity } from '@/types/map2d'
import { EntityType } from '@/types/entity'
import { Window } from './index.d'

export class WindowEntity implements Entity {
  id: string
  type: EntityType = 'window'
  x: number
  y: number
  window: Window

  constructor(window: Window) {
    this.window = window
    this.id = window.id
    this.x = window.x
    this.y = window.y
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
  }

  draw3D(scene: any): void {
    // 实现窗户的3D绘制逻辑
  }
}
