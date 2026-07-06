import { PointObjData } from '@/types/map2d'

export type RegularPolygonData = PointObjData & {
  n: number // 边数
  r: number // 半径
  h: number // 高度
  color: string
  // mt: number | null // 多边形平面材质
  angleY: number
}
