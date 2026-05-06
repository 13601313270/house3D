import { ObjInWallData } from '@/types/map2d'

export type OutFileInWallData = ObjInWallData & {
  fileTypeId: string
  bm: number | null // 材质
  color: string
}
