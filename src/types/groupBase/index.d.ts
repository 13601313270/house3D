import { PointObjData, PointCanAngleObjData } from '@/types/map2d'
import { BaseObjData } from "@/types/map2d"
import { BaseEntityClass } from '@/types/baseEntity'

export type GroupBaseData = PointCanAngleObjData & {
  childrenData: Array<{
    type: string,
    value: BaseObjData,
  }>,
  name: string,
  x: number
  y: number
  z: number,
}
