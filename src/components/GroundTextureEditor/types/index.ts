export interface Point {
  x: number
  y: number
}

export interface SpriteLibraryItem {
  id: string
  name: string
  icon: string
  color: string
  drawType: ElementType
  defaultWidth?: number
  defaultHeight?: number
}

export type ElementType = 'sprite' | 'polyline' | 'polygon'

export { BaseElement, type BaseElementData } from './baseElement'
export { BaseElementDefinition } from './elementDefinition'