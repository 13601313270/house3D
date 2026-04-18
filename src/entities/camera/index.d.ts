import { Entity } from '@/types/map2d'

export type CameraData = Entity & {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  fov: number
}
