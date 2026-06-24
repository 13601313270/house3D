import { DefaultItem } from "../pluginType";
import { ImportFileData } from "./index.d"

export default function (): DefaultItem<ImportFileData>[] {
  // @ts-ignore
  const findObjInfo = window.ObjFiles[0];
  const data: ImportFileData = {
    fileTypeId: findObjInfo.id,
    id: Date.now().toString(),
    angleY: 0,
    bm: null,
    scale: 1,
    x: 0,
    y: 0,
    z: findObjInfo.defaultZ || 0,
    color: '#0c7f25',
  }

  const values: DefaultItem<ImportFileData>[] = [
    {
      name: '导入对象',
      data
    }
  ]
  return values
}