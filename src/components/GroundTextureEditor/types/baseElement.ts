import type { Point } from './index'

export interface BaseElementData {
  id: string
  opacity: number
  zIndex: number
}

export abstract class BaseElement<T extends BaseElementData> {
  abstract type: string
  data: T
  // eslint-disable-next-line no-useless-constructor
  constructor(protected world: any, data: T) {
    this.data = data
  }

  abstract draw(ctx: CanvasRenderingContext2D): void

  abstract drawPreview(
    ctx: CanvasRenderingContext2D,
    mousePos: Point
  ): void

  abstract handleMouseDown(pos: Point): void

  abstract handleMouseMove(pos: Point): void

  abstract handleMouseUp(pos: Point): boolean

  abstract containsPoint(pos: Point): boolean

  abstract translate(dx: number, dy: number): void

  getProperties(): Record<string, any> {
    return {
      id: this.data.id,
      opacity: this.data.opacity,
      zIndex: this.data.zIndex,
    }
  }

  abstract setProperties(props: Record<string, any>): void

  canFinishDrawing(): boolean {
    return true
  }
}