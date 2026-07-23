import { PlaneGroupData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<PlaneGroupData>[] {
  const values: DefaultItem<PlaneGroupData>[] = [
    {
      name: '组',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        childrenData: [],
        angleY: 0,
        name: '组' + Date.now(),
        width: 200,
        height: 200,
      } as PlaneGroupData
    }
  ]
  return values
}