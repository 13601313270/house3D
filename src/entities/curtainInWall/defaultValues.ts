import { CurtainInWallData } from "./index.d"
import { DefaultItem } from "../pluginType"

export default function (): DefaultItem<CurtainInWallData>[] {
  const data: CurtainInWallData = {
    width: 200,
    height: 200,
    wallPointId: -1,
    wallId: '',
    angle: 0,
    bottom: 0, // 不推荐使用，建议使用z轴高度
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 40,
    img: '',
    isOuter: false,
  }
  const values: DefaultItem<CurtainInWallData>[] = [{
    name: '窗帘',
    data
  }]
  return values
}