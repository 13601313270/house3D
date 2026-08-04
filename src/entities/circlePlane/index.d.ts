import { PointObjData, PointCanAngleObjData } from '@/types/map2d'

export type CirclePlaneData = PointCanAngleObjData & {
  r: number
  color: string
  img?: string // 图片
  mt: number | null // 方块材质
  ds: boolean // 是否双面可见
}
