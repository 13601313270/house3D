import { ObjData } from '@/types/map2d'

export type ImportFileData = ObjData & {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质
  color: string
}
