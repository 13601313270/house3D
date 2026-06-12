import { PointObjData } from '@/types/map2d'

export type SphereData = PointObjData & {
  r: number
  color: string
  mt: number | null // 方块材质
}
