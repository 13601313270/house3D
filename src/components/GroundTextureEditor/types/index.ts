export interface Point {
  x: number
  y: number
}

export interface SpriteLibraryItem {
  id: string
  name: string
  icon: string
  color: string
  drawType: 'sprite' | 'polyline' | 'polygon'
  defaultWidth?: number
  defaultHeight?: number
}

export type ElementType = 'sprite' | 'polyline' | 'polygon'

export { BaseElement, type BaseElementData } from './baseElement'
export { SpriteElement, type SpriteElementData } from './spriteElement'
export { PolylineElement, type PolylineElementData } from './polylineElement'
export { PolygonElement, type PolygonElementData } from './polygonElement'