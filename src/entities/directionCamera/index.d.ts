import { PointObjData } from '@/types/map2d'

export type DirectionCameraData = PointObjData & {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  fov: number
  aspectW: number
  aspectH: number
}
