import { Point, Entity } from '@/types/map2d'
import { EntityType } from '@/types/entity'
import { Wall } from './index.d'

export class WallEntity implements Entity {
  id: string
  type: EntityType = 'wall'
  points: Point[]
  thickness: number
  x: number
  y: number

  constructor(wall: Wall) {
    this.id = wall.id
    this.points = wall.points
    this.thickness = wall.thickness
    this.x = wall.x
    this.y = wall.y
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    canvasWidth: number,
    canvasHeight: number,
    zoomLevel: number
  ): void {
    // 实现墙体的2D绘制逻辑
  }

  draw3D(scene: any): void {
    // 实现墙体的3D绘制逻辑
  }
}
