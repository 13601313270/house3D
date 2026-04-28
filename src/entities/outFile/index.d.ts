import { ObjData } from '@/types/map2d'

export type OutFileData = ObjData & {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质
}
