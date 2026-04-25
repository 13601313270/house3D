import { ObjData } from '@/types/map2d'

export type CameraData = ObjData & {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  fov: number
  aspectW: number
  aspectH: number
}
