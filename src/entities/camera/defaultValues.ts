import { CameraData } from "./index.d";

export default function () {
  const defaultValues: CameraData[] = [
    {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 100,
      aspectW: 9,
      aspectH: 16,
      // 相机目标位置
      targetPositionX: 0,
      targetPositionY: 0,
      targetPositionZ: 100,
      fov: 55,
    }
  ]
  const values: CameraData[] = defaultValues
  return values
}