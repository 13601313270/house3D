import { DefaultItem } from "../pluginType";
import { OutFileData } from "./index.d"

export default function (): DefaultItem<OutFileData>[] {
  const data: OutFileData = {
    fileTypeId: '',
    id: Date.now().toString(),
    angleY: 0,
    bm: null,
    x: 0,
    y: 0,
    z: 0,
    color: '#0c7f25',
    canAngelZ: true,
    zoom: 1,
    data: {},
  }
  const values: DefaultItem<OutFileData>[] = [
    {
      name: '对象',
      data
    }
  ]
  return values
}