import { ObjData } from '@/types/map2d'

export type ConeData = ObjData & {
  r: number
  h: number
  color: string
  mt: number | null // 方块材质
}
