import type { BaseElement, BaseElementData, ElementType } from './index'

type BaseElementCtor = (new (...args: any[]) => BaseElement<any>) & {
  defaultData: () => BaseElementData
}

type IconDataType = 'roadSigns' | 'groundTexture' | 'road'

const allIconDataType: IconDataType[] = ['roadSigns', 'groundTexture', 'road']

export type BaseElementDefinition = {
  id: string
  name: string
  icon: string
  type: ElementType
  dataType: IconDataType
  createClass: BaseElementCtor
}
