import { CurtainInWallData } from "./index.d"

export default function () {
  const data: CurtainInWallData = {
    width: 200,
    height: 200,
    wallPointId: -1,
    wallId: '',
    angle: 0,
    bottom: 40,
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 0,
    img: '',
    isOuter: false,
  }
  const values: CurtainInWallData[] = [data]
  return values
}