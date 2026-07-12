import { BaseObjData, PointObjData } from '@/types/map2d'
import { BaseEntityClass } from '@/types/baseEntity'

export type PointGroupData = PointObjData & {
  angleY: number,
  groupData: Array<{
    type: string,
    data: BaseObjData,
  }>
}
