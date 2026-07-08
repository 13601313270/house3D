import { CameraBaseData } from '@/types/CameraBase'

export type DirectionCameraData = CameraBaseData & {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  fov: number
  aspectW: number
  aspectH: number
}
