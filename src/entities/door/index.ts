import { Point, Entity } from '@/types/map2d'
import { EntityType } from '@/types/entity'
import { Door } from './index.d'
import { drawEntity } from '@/utils/drawUtils'

export class DoorEntity implements Entity {
  id: string
  type: EntityType = 'door'
  wallId: string
  x: number
  y: number
  width: number
  angle: number
  door: Door

  constructor(door: Door) {
    this.door = door
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
    zoomLevel: number
  ): void {
    // 实现门的2D绘制逻辑
    const screenX = this.door.x * zoomLevel + panOffset.x
    const screenY = this.door.y * zoomLevel + panOffset.y
    const wallThickness = 10; // walls.find((wall) => wall.id === this.door.wallId)?.thickness || 0;
    drawEntity(ctx, screenX, screenY, this.door.width * zoomLevel, this.door.angle, '#e67e22', 'door', wallThickness * zoomLevel)
  }

  draw3D(scene: any): void {
    // 实现门的3D绘制逻辑
  }
}
