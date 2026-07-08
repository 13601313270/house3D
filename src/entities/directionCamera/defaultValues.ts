import { DirectionCameraData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<DirectionCameraData>[] {
  const defaultValues: DefaultItem<DirectionCameraData>[] = [
    {
      name: '相机(相机位置+方向)',
      data: {
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
    }
  ]
  return defaultValues
}
