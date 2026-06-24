import { DefaultItem } from "../pluginType";
import { OutFileData } from "./index.d"

export default function (): DefaultItem<OutFileData>[] {
  // @ts-ignore
  const findObjInfo = window.ObjFiles[0];
  const data: OutFileData = {
    fileTypeId: findObjInfo.id,
    id: Date.now().toString(),
    angleY: 0,
    bm: null,
    x: 0,
    y: 0,
    z: findObjInfo.defaultZ || 0,
    color: '#0c7f25',
    canAngelZ: findObjInfo.canAngelZ,
  }
  const values: DefaultItem<OutFileData>[] = [
    {
      name: '对象',
      data
    }
  ]
  return values
}