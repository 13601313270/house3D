import { PointGroupData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<PointGroupData>[] {
  const values: DefaultItem<PointGroupData>[] = [
    {
      name: '点组',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        angleY: 0,
      }
    }
  ]
  return values
}