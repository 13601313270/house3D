import { ImportFileData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class ImportFileDataClass extends PointObjDataClass<ImportFileData> {
  fileTypeId: string
  angleY: number
  scale: number

  constructor(data: ImportFileData) {
    super(data)
    this.fileTypeId = data.fileTypeId
    this.angleY = data.angleY
    this.scale = data.scale
  }
}