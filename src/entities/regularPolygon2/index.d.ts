import { PointObjData } from '@/types/map2d'

export type RegularPolygon2Data = PointObjData & {
  n: number // 边数
  r: number // 半径
  r2: number // 头部半径
  h: number // 高度
  color: string
  // mt: number | null // 多边形平面材质
  angleY: number
}
