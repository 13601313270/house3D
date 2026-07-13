import { GroupData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<GroupData>[] {
  const values: DefaultItem<GroupData>[] = [
    {
      name: '组',
      data: {
        id: Date.now().toString(),
        // x: 0,
        // y: 0,
        // z: 0,
        childrenData: [],
        angleY: 0,
      }
    }
  ]
  return values
}