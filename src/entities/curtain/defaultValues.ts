import { CurtainData } from "./index.d";

export default function () {
  const values: CurtainData[] = [
    {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      width: 200,
      height: 200,
      angleY: 0,
      img: '',
    }
  ]
  return values
}
