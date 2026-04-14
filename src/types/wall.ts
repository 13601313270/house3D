import { Point, Entity } from './map2d'

export type Wall = Entity & {
  points: Point[]
  thickness: number
}
