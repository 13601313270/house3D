import { PeopleData } from "./index.d"

export default function () {
  const values: PeopleData[] = [
    {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      angle: 0,
      color: '#DEDEDE',
      height: 170,
      bone: [],
    }
  ]
  return values
}