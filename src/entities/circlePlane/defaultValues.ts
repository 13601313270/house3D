import { DefaultItem } from "../pluginType"
import { CirclePlaneData } from "./index.d"

export default function (): DefaultItem<CirclePlaneData>[] {
  const values: DefaultItem<CirclePlaneData>[] = [
    {
      name: '圆形平面',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        r: 100,
        color: '#a3998fff',
        mt: null,
        ds: true,
        angleY: 0,
      }
    }
  ]
  return values
}