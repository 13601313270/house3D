import { PointWithTargetObjData } from '@/types/map2d'

export type CameraData = PointWithTargetObjData & {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  fov: number
  aspectW: number
  aspectH: number
}
