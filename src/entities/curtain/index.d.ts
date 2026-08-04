import { PointObjData, PointCanAngleObjData } from '@/types/map2d'

export type CurtainData = PointCanAngleObjData & {
  width: number
  height: number
  img: string
}
