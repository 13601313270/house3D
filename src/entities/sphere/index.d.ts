import { ObjData } from '@/types/map2d'

export type SphereData = ObjData & {
  r: number
  color: string
  mt: number | null // 方块材质
}
