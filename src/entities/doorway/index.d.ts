import { ObjInWallData } from '@/types/map2d'

export type DoorData = ObjInWallData & {
  width: number
  height: number
  color: string
  mt: number // 门材质
  hasBorder: boolean // 是否有门框
}
