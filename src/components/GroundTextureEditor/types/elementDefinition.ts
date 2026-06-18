import type { BaseElement, BaseElementData, ElementType } from './index'

type BaseElementCtor = (new (...args: any[]) => BaseElement<any>) & {
  defaultData: () => BaseElementData
}

export abstract class BaseElementDefinition {
  abstract id: string
  abstract name: string
  abstract icon: string
  abstract type: ElementType
  abstract createClass: BaseElementCtor
}

export type ElementDefinition = BaseElementDefinition