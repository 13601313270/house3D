import { CameraBaseData } from '@/types/CameraBase'

export type DirectionCameraData = CameraBaseData & {
  angleY: number
  fov: number
  aspectW: number
  aspectH: number
}
