import { CameraData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<CameraData>[] {
  const defaultValues: DefaultItem<CameraData>[] = [
    {
      name: '相机',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 100,
        fov: 55,
        aspectW: 9,
        aspectH: 16,
        // 相机目标位置
        targetPositionX: 0,
        targetPositionY: 0,
        targetPositionZ: 100,
      }
    }
  ]
  return defaultValues
}