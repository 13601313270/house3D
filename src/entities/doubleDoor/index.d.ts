import { ObjInWallData } from '@/types/map2d'

export type DoubleDoorData = ObjInWallData & {
  width: number
  height: number
  color: string
  mt: number // 门材质
  hasBorder: boolean // 是否有门框
  openType: number // 开门方式 1内开 2外开（两扇门同步开合）
  leftOpenAngle: number// 左扇门打开的角度
  rightOpenAngle: number// 右扇门打开的角度
}
