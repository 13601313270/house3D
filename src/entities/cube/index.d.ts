import { PointObjData } from '@/types/map2d'

export type CubeData = PointObjData & {
  width: number
  height: number
  depth: number
  color: string
  mt: number | null // 方块材质
  angleY: number
}
