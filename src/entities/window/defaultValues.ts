import { WindowData } from "./index.d";
import { DefaultItem } from "../pluginType";

export default function (): DefaultItem<WindowData>[] {
  const data = {
    id: Date.now().toString(),
    wallPointId: -1,
    wallId: '',
    x: 0,
    y: 0,
    z: 0,
    width: 120,
    height: 120,
    angle: 0,
    bottom: 40,
    bqc: '#3498db',
    bmt: 1,
    tc: '#3498db',
    tmt: 1,
    ic: '#3498db',
    icmt: 1,
    hasBorder: false,// 是否有窗户框
    rightOpenAngle: 0, // 右门打开角度
    leftOpenAngle: 0, // 左门打开角度
  };
  const values: DefaultItem<WindowData>[] = [
    {
      data
    }
  ]
  return values
}
