import { PointObjData, PointCanAngleObjData } from '@/types/map2d'

export type CubeData = PointCanAngleObjData & {
  width: number
  height: number
  depth: number
  color: string
  mt: number | null // 方块材质
}
