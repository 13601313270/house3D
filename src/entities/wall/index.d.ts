import { Point, Entity } from '@/types/map2d'

export type Wall = Entity & {
  points: Point[]
  thickness: number
  color: string
  hb: boolean // 是否有地板
  bc: string // 地板颜色
  ht: boolean // 是否有天花板
  tc: string // 天花板颜色
  td: boolean // 天花板是否是双面
}
