import type { ElementType } from './index'

export abstract class BaseElementDefinition {
  abstract id: string
  abstract name: string
  abstract icon: string
  abstract type: ElementType
  abstract drawType: ElementType
  abstract color: string

  defaultWidth?: number
  defaultHeight?: number
  defaultZIndex?: number

  getDefaultWidth(): number {
    return this.defaultWidth || 50
  }

  getDefaultHeight(): number {
    return this.defaultHeight || 50
  }

  getDefaultZIndex(): number {
    return this.defaultZIndex || 0
  }

  validate(): boolean {
    return !!(this.id && this.name && this.type && this.drawType)
  }
}

export type ElementDefinition = BaseElementDefinition