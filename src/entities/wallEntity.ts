import { Entity, EntityType } from '../types/entity'
import { Point, Wall } from '../types/map2d'

export class WallEntity extends Entity {
  id: string
  type: EntityType = 'wall'
  points: Point[]
  thickness: number

  constructor(wall: Wall) {
    super()
    this.id = wall.id
    this.points = wall.points
    this.thickness = wall.thickness
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
