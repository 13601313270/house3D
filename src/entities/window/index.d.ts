import { ObjInWallData } from '@/types/map2d'

export type WindowData = ObjInWallData & {
  width: number
  height: number
  bqc: string // 包墙颜色
  bmt: number // 包墙材质
  tc: string // 门框颜色
  tmt: number // 门框材质
  ic: string // 玻璃框颜色
  icmt: number // 玻璃框材质
  hasBorder: boolean // 是否有门框
  rightOpenAngle: number // 右门打开角度
  leftOpenAngle: number // 左门打开角度
}
