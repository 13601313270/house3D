import { ConeData } from "./index.d";

export default function () {
  const values: ConeData[] = [
    {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      r: 50,
      h: 100,
      color: '#e67e22',
      mt: null,
    }
  ]
  return values
}