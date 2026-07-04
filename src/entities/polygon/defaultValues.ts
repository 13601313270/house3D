import { PolygonData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<PolygonData>[] {
  const values: DefaultItem<PolygonData>[] = [
    {
      name: '折线体',
      data: {
        id: Date.now().toString(),
        height: 100,
        color: '#fff',
        points: [],
        // cornerType: 1,
        z: 0,
      }
    }
  ]
  return values
}
