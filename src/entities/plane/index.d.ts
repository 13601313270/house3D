import { PointObjData } from '@/types/map2d'

export type PlaneData = PointObjData & {
  width: number
  length: number
  color: string
  img?: string // 图片
  mt: number | null // 方块材质
  angleY: number // 旋转角度
}
