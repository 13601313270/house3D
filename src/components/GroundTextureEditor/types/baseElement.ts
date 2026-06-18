import type { Point } from './index'

export interface BaseElementData {
  id: string
  opacity: number
  zIndex: number
}

export abstract class BaseElement {
  abstract type: 'sprite' | 'polyline' | 'polygon'
  abstract data: BaseElementData
  // eslint-disable-next-line no-useless-constructor
  protected constructor(protected world: any) {}

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

  abstract getProperties(): Record<string, any>

  abstract setProperties(props: Record<string, any>): void
}