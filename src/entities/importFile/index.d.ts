import { PointObjData, PointCanAngleObjData } from '@/types/map2d'
import { ModelFileData } from '@/types/modelFileEntity'

export type ImportFileData = ModelFileData & {
  fileTypeId: string
}
