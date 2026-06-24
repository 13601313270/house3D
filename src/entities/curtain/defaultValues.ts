import { DefaultItem } from "../pluginType";
import { CurtainData } from "./index.d";

export default function (): DefaultItem<CurtainData>[] {
  const values: DefaultItem<CurtainData>[] = [
    {
      name: '窗帘',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        width: 200,
        height: 200,
        angleY: 0,
        img: '',
      }
    }
  ]
  return values
}
