import { PointObjData } from '@/types/map2d'
import { BaseObjData } from "@/types/map2d"
import { BaseEntityClass } from '@/types/baseEntity'
import { GroupBaseData } from '@/types/groupBase'

export type PlaneGroupData = GroupBaseData & {
  width: number
  height: number
}
