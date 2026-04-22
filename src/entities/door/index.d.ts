import { Entity } from '@/types/map2d'

export type Door = Entity & {
  wallId?: string,// 所属墙ID，如果没有磁吸在墙上，为undefined
  wallPointId: number // 门在墙上的点的索引（比如0，代表从0到1的墙面上，-1代表未磁吸在墙上）
  width: number
  height: number
  angle: number
  color: string
  hasBorder: boolean // 是否有门框
  openType: number // 开门方式 1内左开 2内右开 3外左开 4外右开
  openAngle: number// 门打开的角度
}
