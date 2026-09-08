import { PointWithTargetObjData } from '@/types/map2d'

export type CameraData = PointWithTargetObjData & {
  fov: number
  aspectW: number
  aspectH: number
}
