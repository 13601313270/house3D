import { PointObjData } from '@/types/map2d'

export type SignData = PointObjData & {
  angleY: number // 旋转角度
  stitchImage: string // 图片数据（JSON格式）
}
