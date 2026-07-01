import { PointObjData } from '@/types/map2d'

export type ImportFileData = PointObjData & {
  fileTypeId: string
  angleY: number
  scale: number,
}
