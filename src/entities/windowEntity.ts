import { Point, Entity } from '../types/map2d'
import { EntityType } from '../types/entity'
import { Window } from '../types/window'

export class WindowEntity implements Entity {
  id: string
  type: EntityType = 'window'
  wallId: string
  x: number
  y: number
  width: number
  angle: number

  constructor(window: Window) {
    this.id = window.id
    this.x = window.x
    this.y = window.y
    this.wallId = window.wallId
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
