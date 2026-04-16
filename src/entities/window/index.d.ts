import { Entity } from '@/types/map2d'

export type Window = Entity & {
  wallId?: string,// 所属墙ID，如果没有磁吸在墙上，为undefined
  wallPointId: number // 门在墙上的点的索引（比如0，代表从0到1的墙面上，-1代表未磁吸在墙上）
  width: number
  height: number
  angle: number
  bottom: number// 距离地面
}
