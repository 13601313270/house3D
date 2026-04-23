import { Entity } from '@/types/map2d'

export type Window = Entity & {
  wallId?: string,// 所属墙ID，如果没有磁吸在墙上，为undefined
  wallPointId: number // 门在墙上的点的索引（比如0，代表从0到1的墙面上，-1代表未磁吸在墙上）
  width: number
  height: number
  angle: number
  bottom: number // 距离地面
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
