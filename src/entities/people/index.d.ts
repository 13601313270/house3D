import { PointObjData } from '@/types/map2d'

export type BoneStepItem = {
  name: string
  value: {
    x: number
    y: number
    z: number
    px: number
    py: number
    pz: number
  }
}
export type PeopleData = PointObjData & {
  angle: number
  height: number,// 身高
  color?: string,// 人物颜色
  bone?: Array<BoneStepItem>
}
