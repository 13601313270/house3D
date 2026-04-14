import { Point } from './map2d'

export type EntityType = 'wall' | 'door' | 'window' | 'bed' | string

export abstract class Entity {
  abstract id: string
  abstract type: EntityType

  abstract draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    canvasWidth: number,
    canvasHeight: number,
    zoomLevel: number
  ): void

  abstract draw3D(scene: any): void
}
