import { DefaultItem } from "../pluginType";
import { ImportFileData } from "./index.d"

export default function (): DefaultItem<ImportFileData>[] {
  const data: ImportFileData = {
    fileTypeId: '',
    id: Date.now().toString(),
    angleY: 0,
    scale: 1,
    x: 0,
    y: 0,
    z: 0,
  }

  const values: DefaultItem<ImportFileData>[] = [
    {
      name: '导入对象',
      data
    }
  ]
  return values
}