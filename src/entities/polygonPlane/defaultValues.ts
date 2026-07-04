import { PolygonPlaneData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<PolygonPlaneData>[] {
  const values: DefaultItem<PolygonPlaneData>[] = [
    {
      name: '墙',
      data: {
        id: Date.now().toString(),
        height: 280,
        color: '#fff',
        points: [],
        cornerType: 1,
      }
    }
  ]
  return values
}
