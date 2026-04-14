import { Entity } from './map2d'

export type Door = Entity & {
  wallId: string
  width: number
  angle: number
}
