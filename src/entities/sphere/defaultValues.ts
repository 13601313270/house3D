import { SphereData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<SphereData>[] {
  const values: DefaultItem<SphereData>[] = [
    {
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        r: 50,
        color: '#e67e22',
        mt: null,
      }
    }
  ]
  return values
}