import { PointObjData, PointCanAngleObjData } from '@/types/map2d'

export type ImportFileData = PointCanAngleObjData & {
  fileTypeId: string
  scale: number,
}
