import { PointObjData } from '@/types/map2d'
import { BaseObjData } from "@/types/map2d"
import { BaseEntityClass } from '@/types/baseEntity'

export type GroupData = PointObjData & {
  childrenData: Array<{
    type: string,
    value: BaseObjData,
  }>,
  angleY: number
}
