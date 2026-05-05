import { OutFileData } from "./index.d"
import { ObjDataClass } from "../objData"

export class OutFileDataClass extends ObjDataClass<OutFileData> {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质
  color: string

  constructor(data: OutFileData) {
    super(data)
    this.fileTypeId = data.fileTypeId
    this.angleY = data.angleY
    this.bm = data.bm
    this.color = data.color
  }
}