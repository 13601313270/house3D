import { RegularPolygon2Data } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<RegularPolygon2Data>[] {
  const values: DefaultItem<RegularPolygon2Data>[] = [
    {
      name: 'N边形锥',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        n: 5,
        r: 50,
        r2: 0,
        h: 100,
        color: '#b1b1b1',
        // mt: null,
        angleY: 0,
      }
    }
  ]
  return values
}