import { DefaultItem } from "../pluginType"
import { PeopleData } from "./index.d"

export default function () {
  const values: DefaultItem<PeopleData>[] = [
    {
      name: '男性',
      data: {
        id: 'people_male_' + Date.now(),
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        angleY: 0,
        color: '#DEDEDE',
        height: 170,
        bone: [],
        modelType: 'man',
      }
    },
    {
      name: '女性',
      data: {
        id: 'people_female_' + Date.now(),
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        angleY: 0,
        color: '#DEDEDE',
        height: 170,
        bone: [],
        modelType: 'woman',
      }
    },
  ]
  return values
}