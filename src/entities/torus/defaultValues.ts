import { TorusData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<TorusData>[] {
  const values: DefaultItem<TorusData>[] = [
    {
      name: '环体',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        r: 50,
        t: 10,
        color: '#e67e22',
        mt: null,
      }
    }
  ]
  return values
}