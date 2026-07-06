import { RegularPolygonData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<RegularPolygonData>[] {
  const values: DefaultItem<RegularPolygonData>[] = [
    {
      name: 'N边形体',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        n: 5,
        r: 50,
        h: 100,
        color: '#b1b1b1',
        // mt: null,
        angleY: 0,
      }
    }
  ]
  return values
}