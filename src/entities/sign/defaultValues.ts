import { DefaultItem } from "../pluginType"
import { SignData } from "./index.d"

export default function (): DefaultItem<SignData>[] {
  const values: DefaultItem<SignData>[] = [
    {
      name: '标志',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        angleY: 0,
        width: 80,
        height: 80,
        signZ: 100,
        shape: 'rect',
        poleRadius: 5,
        bgColor: '#ffffff',
        poleColor: '#666666',
        img: {
          value: [],
          viewImg: '',
        },
      }
    }
  ]
  return values
}
