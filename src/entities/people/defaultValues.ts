import { DefaultItem } from "../pluginType"
import { PeopleData } from "./index.d"

export default function () {
  const values: DefaultItem<PeopleData>[] = [
    {
      name: '白模',
      img: '/toolType/people.png',
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
  ]
  return values
}