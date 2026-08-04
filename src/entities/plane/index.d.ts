import { PointObjData, PointCanAngleObjData } from '@/types/map2d'

export type PlaneData = PointCanAngleObjData & {
  width: number
  length: number
  color: string
  img?: string // 图片
  mt: number | null // 方块材质
}
