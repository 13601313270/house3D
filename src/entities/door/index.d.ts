import { ObjInWallData } from '@/types/map2d'

export type DoorData = ObjInWallData & {
  width: number
  height: number
  color: string
  mt: number // 门材质
  hasBorder: boolean // 是否有门框
  openType: number // 开门方式 1内左开 2内右开 3外左开 4外右开
  openAngle: number// 门打开的角度
}
