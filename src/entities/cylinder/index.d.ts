import { PointObjData } from '@/types/map2d'

export type CylinderData = PointObjData & {
  r: number
  h: number
  color: string
  mt: number | null // 方块材质
}
