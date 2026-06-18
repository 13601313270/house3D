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
export { type ElementDefinition, BaseElementDefinition } from './elementDefinition'