import { WallData } from "./index.d"

export default function () {
  const values: WallData[] = [
    {
      id: Date.now().toString(),
      height: 280,
      color: '#fff',
      wmt: 0,
      points: [],
      thickness: 20,
      hb: true,
      bc: '#aaa',
      bmt: 2,
      ht: true,
      tc: '#fff',
      tmt: 2,
      td: false,
      bottom: 0,
      cornerType: 1,
    }
  ]
  return values
}
