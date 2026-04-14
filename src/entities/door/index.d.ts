import { Entity } from '@/types/map2d'

export type Door = Entity & {
  wallId: string
  width: number
  angle: number
}
