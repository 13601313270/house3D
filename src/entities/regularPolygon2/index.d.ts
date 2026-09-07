import { PointObjData, PointCanAngleObjData } from '@/types/map2d'

export type RegularPolygon2Data = PointCanAngleObjData & {
  n: number // 边数
  r: number // 半径
  r2: number // 头部半径
  h: number // 高度
  color: string
}
