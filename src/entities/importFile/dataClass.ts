import { ImportFileData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class ImportFileDataClass extends PointObjDataClass<ImportFileData> {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质
  color: string
  scale: number

  constructor(data: ImportFileData) {
    super(data)
    this.fileTypeId = data.fileTypeId
    this.angleY = data.angleY
    this.bm = data.bm
    this.color = data.color
    this.scale = data.scale
  }
}