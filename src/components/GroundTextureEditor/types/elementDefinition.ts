import type { BaseElement, BaseElementData, ElementType } from './index'

type BaseElementCtor = (new (...args: any[]) => BaseElement<any>) & {
  defaultData: () => BaseElementData
}

export type IconDataType = 'groundSigns' | 'groundTexture' | 'road' | 'roadSigns'

// const allIconDataType: IconDataType[] = ['groundSigns', 'groundTexture', 'road', 'roadSigns']

export type BaseElementDefinition = {
  id: string
  name: string
  icon: string
  type: ElementType
  dataType: IconDataType
  createClass: BaseElementCtor
}
