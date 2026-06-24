import { DefaultItem } from "../pluginType"
import { DoorData } from "./index.d"

export default function (): DefaultItem<DoorData>[] {
  const data: DoorData = {
    id: Date.now().toString(),
    wallPointId: -1,
    x: 0,
    y: 0,
    z: 0,
    width: 110,
    height: 180,
    bottom: 0,
    openAngle: 0,
    angle: 0,
    hasBorder: true,
    color: '#e67e22',
    mt: 3,
    openType: 1,
  }
  const values: DefaultItem<DoorData>[] = [{
    name: '门',
    data
  }]
  return values
}