import { PlaneData } from "./index.d"

export default function () {
  const values: PlaneData[] = [
    {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      width: 200,
      length: 200,
      color: '#a3998fff',
      mt: null,
      angleY: 0,
    }
  ]
  return values
}