import { PointObjData } from '@/types/map2d'

export type DirectionCameraData = PointObjData & {
  angleY: number
  fov: number
  aspectW: number
  aspectH: number
}
