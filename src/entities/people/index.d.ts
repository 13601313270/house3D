import { ObjData } from '@/types/map2d'

export type PeopleData = ObjData & {
  angle: number
  height: number,// 身高
  bone?: Array<{
    name: string
    value: {
      x: number
      y: number
      z: number
    }
  }>
}
