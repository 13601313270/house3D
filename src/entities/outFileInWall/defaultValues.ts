import { DefaultItem } from "../pluginType";
import { OutFileInWallData } from "./index.d"

export default function (): DefaultItem<OutFileInWallData>[] {
  // @ts-ignore
  const findObjInfo = window.ObjFiles[0];
  const data: OutFileInWallData = {
    wallPointId: -1,
    wallId: '',
    angle: 0,
    bottom: 0, // 不推荐使用，建议使用z轴高度
    fileTypeId: findObjInfo.id,
    id: Date.now().toString(),
    bm: null,
    x: 0,
    y: 0,
    z: 40,
    color: '#0c7f25',
    isOuter: false,
    canAngelZ: findObjInfo.canAngelZ,
  }

  const values: DefaultItem<OutFileInWallData>[] = [
    {
      name: '墙上的对象',
      data
    }
  ]
  return values
}