import { PointObjData } from '@/types/map2d'

export type ImportFileData = PointObjData & {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质
  scale: number,
  color: string
}
