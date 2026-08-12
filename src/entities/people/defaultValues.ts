import { DefaultItem } from "../pluginType"
import { PeopleData } from "./index.d"

export default function () {
  const values: DefaultItem<PeopleData>[] = [
    {
      name: '人物',
      data: {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        angleY: 0,
        color: '#DEDEDE',
        height: 170,
        bone: [],
      }
    }
  ]
  return values
}