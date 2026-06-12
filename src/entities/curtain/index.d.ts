import { PointObjData } from '@/types/map2d'

export type CurtainData = PointObjData & {
  width: number
  height: number
  angleY: number // 旋转角度
  img: string
}
