import { PointObjData } from '@/types/map2d'

export type CirclePlaneData = PointObjData & {
  r: number
  color: string
  img?: string // 图片
  mt: number | null // 方块材质
  ds: boolean // 是否双面可见
  angleY: number // 旋转角度Y
}
