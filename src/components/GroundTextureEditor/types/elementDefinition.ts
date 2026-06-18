import type { BaseElement, BaseElementData, ElementType } from './index'

type BaseElementCtor = (new (...args: any[]) => BaseElement<any>) & {
  defaultData: () => BaseElementData
}

export type BaseElementDefinition  = {
  id: string
  name: string
  icon: string
  type: ElementType
  createClass: BaseElementCtor
}
