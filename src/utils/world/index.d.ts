import { PointObjData } from '@/types/map2d'
import { BaseObjData } from "@/types/map2d"
import { BaseEntityClass } from '@/types/baseEntity'

export type GroupData = PointObjData & {
  children: BaseObjData[],
  angleY: number
}
