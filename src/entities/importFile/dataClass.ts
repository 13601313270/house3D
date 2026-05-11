import { ImportFileData } from "./index.d"
import { ObjDataClass } from "../objData"

export class ImportFileDataClass extends ObjDataClass<ImportFileData> {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质
  color: string

  constructor(data: ImportFileData) {
    super(data)
    this.fileTypeId = data.fileTypeId
    this.angleY = data.angleY
    this.bm = data.bm
    this.color = data.color
  }
}