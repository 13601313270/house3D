import { DefaultItem } from "../pluginType"
import { DoubleDoorData } from "./index.d"

export default function (): DefaultItem<DoubleDoorData>[] {
  const data: DoubleDoorData = {
    id: Date.now().toString(),
    wallPointId: -1,
    x: 0,
    y: 0,
    z: 0,
    width: 200,
    height: 210,
    bottom: 0,
    openAngle: 0,
    angle: 0,
    hasBorder: true,
    color: '#e67e22',
    mt: 3,
    openType: 1,
  }
  const values: DefaultItem<DoubleDoorData>[] = [{
    name: '对开门',
    data
  }]
  return values
}
