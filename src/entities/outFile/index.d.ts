import { PointObjData, PointCanAngleObjData } from '@/types/map2d'

export type OutFileData = PointCanAngleObjData & {
  fileTypeId: string
  bm: number | null // 材质
  color: string
  canAngelZ: boolean,// 是否可以旋转Z轴角度
  zoom?: number,
  data?: Record<string, any>,
}
