import { PointObjData } from '@/types/map2d'
import { BaseObjData } from "@/types/map2d"

export type GroupData = PointObjData & {
  groupData: Array<{
    type: string,
    data: BaseObjData,
  }>
  angleY: number
}
