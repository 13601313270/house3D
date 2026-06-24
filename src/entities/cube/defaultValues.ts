import { CubeData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<CubeData>[] {
  const values: DefaultItem<CubeData>[] = [
    {
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        width: 110,
        height: 180,
        depth: 100,
        color: '#b1b1b1',
        mt: null,
        angleY: 0,
      }
    }
  ]
  return values
}