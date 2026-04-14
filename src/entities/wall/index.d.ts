import { Point, Entity } from '@/types/map2d'

export type Wall = Entity & {
  points: Point[]
  thickness: number
}
