import type { ElementType } from './index'

export interface ElementDefinition {
  id: string
  name: string
  icon: string
  type: ElementType
  drawType: ElementType
  color: string
  defaultWidth?: number
  defaultHeight?: number
  defaultZIndex?: number
}

export interface ElementDefinitionLoader {
  load(): ElementDefinition[]
}