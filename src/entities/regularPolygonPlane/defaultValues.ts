import { RegularPolygonPlaneData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<RegularPolygonPlaneData>[] {
  const values: DefaultItem<RegularPolygonPlaneData>[] = [
    {
      name: 'N边形体',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        n: 5,
        r: 50,
        height: 100,
        color: '#b1b1b1',
        // mt: null,
        angleY: 0,
      }
    }
  ]
  return values
}