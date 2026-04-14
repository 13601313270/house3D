import { Entity } from './map2d'

export type Window = Entity & {
  wallId: string
  width: number
  angle: number
}
