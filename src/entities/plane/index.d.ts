import { ObjData } from '@/types/map2d'

export type PlaneData = ObjData & {
  width: number
  length: number
  color: string
  mt: number | null // 方块材质
}
