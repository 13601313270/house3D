import { ObjData } from '@/types/map2d'

export type CurtainData = ObjData & {
  width: number
  height: number
  angleY: number // 旋转角度
  img: string
}
