import { PointObjData } from '@/types/map2d'

export type RegularPolygonPlaneData = PointObjData & {
  n: number // 边数
  r: number // 半径
  height: number // 高度
  color: string
  // mt: number | null // 多边形平面材质
  angleY: number
}
