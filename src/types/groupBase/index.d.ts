import { PointObjData } from '@/types/map2d'
import { BaseObjData } from "@/types/map2d"
import { BaseEntityClass } from '@/types/baseEntity'

export type GroupBaseData = PointObjData & {
  childrenData: Array<{
    type: string,
    value: BaseObjData,
  }>,
  x: number
  y: number
  z: number,
  angleY: number
}
