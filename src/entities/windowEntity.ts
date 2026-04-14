import { Entity, EntityType } from '../types/entity'
import { Point, Window } from '../types/map2d'

export class WindowEntity extends Entity {
  id: string
  type: EntityType = 'window'
  wallId: string
  x: number
  y: number
  width: number
  angle: number

  constructor(window: Window) {
    super()
    this.id = window.id
    this.wallId = window.wallId
    this.x = window.x
    this.y = window.y
    this.width = window.width
    this.angle = window.angle
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    canvasWidth: number,
    canvasHeight: number,
    zoomLevel: number
  ): void {
    // 实现窗户的2D绘制逻辑
  }

  draw3D(scene: any): void {
    // 实现窗户的3D绘制逻辑
  }
}
