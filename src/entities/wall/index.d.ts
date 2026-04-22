import { Point, Entity } from '@/types/map2d'

export type Wall = Entity & {
  points: Point[]
  thickness: number
  color: string
  hb: boolean // 是否有地板
  bc: string // 地板颜色
}
