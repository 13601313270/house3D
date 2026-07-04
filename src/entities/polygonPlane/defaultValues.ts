import { PolygonPlaneData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<PolygonPlaneData>[] {
  const values: DefaultItem<PolygonPlaneData>[] = [
    {
      name: '折线平面',
      data: {
        id: Date.now().toString(),
        color: '#fff',
        points: [],
        // cornerType: 1,
        z: 0,
        ds: true,
        mt: null,
      }
    }
  ]
  return values
}
