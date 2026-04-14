import { Point, Entity } from '@/types/map2d'
import { EntityType } from '@/types/entity'
import { Door } from './index.d'

export class DoorEntity implements Entity {
  id: string
  type: EntityType = 'door'
  wallId: string
  x: number
  y: number
  width: number
  angle: number

  constructor(door: Door) {
    this.id = door.id
    this.x = door.x
    this.y = door.y
    this.wallId = door.wallId
    this.width = door.width
    this.angle = door.angle
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    canvasWidth: number,
    canvasHeight: number,
    zoomLevel: number
  ): void {
    // 实现门的2D绘制逻辑
  }

  draw3D(scene: any): void {
    // 实现门的3D绘制逻辑
  }
}
