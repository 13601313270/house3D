import { DoorData } from "./index.d"

export default function () {
  const values: DoorData[] = [{
    id: Date.now().toString(),
    wallPointId: -1,
    x: 0,
    y: 0,
    z: 0,
    width: 110,
    height: 180,
    bottom: 0,
    angle: 0,
    hasBorder: false,
    color: '#e67e22',
    mt: 3,
  }]
  return values
}