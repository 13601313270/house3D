// 位置+角度
type camera1 = {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  radius: number
  angleX: number
  angleY: number
  aspectW: number,
  aspectH: number,
};
// 位置+目标位置
type camera2 = {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  positionX: number
  positionY: number
  positionZ: number
  fov: number,
  aspectW: number,
  aspectH: number,
}
// 正交相机
export type OrthographicCamera = {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  size: number,
  length: number,
}

export type CameraState = camera1 | camera2