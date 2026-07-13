import { IconDataType } from "@/components/GroundTextureEditor/types/elementDefinition"
import { BaseObjData } from "@/types/map2d"

export type enumItem = {
  id: number | string,
  name: string,
  img: string,
}

export type editItem = {
  id: string,
  label: string,
  dataType: 'string' |
  'poiListAndLineCircle' |
  'poiListAndLine' |
  'poiList' |
  'color' |
  'boolean' |
  'mesh' |
  'area' |
  'material' |
  'hidden' |
  'img' |
  'button' | /* 按钮 */
  string[]/* 枚举 */
  value: any
} | {
  id: string,
  label: string,
  dataType: 'number',
  min: number,
  max: number,
  step: number,
  value: number
  unit?: string
} | {
  id: string,
  label: string,
  dataType: 'title', /* 一个标题，纯展示使用 */
} | {
  id: string,
  label: string,
  dataType: 'cornerType',
  value: number,
  panelDesc?: string,
} | {
  id: string,
  label: string,
  dataType: 'enum',
  value: number | string,
  panelDesc?: string,
  enumList: Array<enumItem>,
} | {
  id: string,
  label: string,
  dataType: 'stitchImage',
  value: {
    value: Array<any>,
    viewImg: string,
  },
  dataTypeList: IconDataType[],
} | {
  id: string,
  label: string,
  dataType: 'angle',
  min: number,
  max: number,
  value: number
} | {
  id: string,
  dataType: 'children',
  value: Array<{
    type: string,
    data: BaseObjData,
  }>
}
export default editItem
