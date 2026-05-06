import { OutFileInWallData } from "./index.d"
import { ObjInWallDataClass } from "../objData"

export class OutFileInWallDataClass extends ObjInWallDataClass<OutFileInWallData> {
  fileTypeId: string
  bm: number | null // 材质
  color: string

  constructor(data: OutFileInWallData) {
    super(data)
    this.fileTypeId = data.fileTypeId
    this.bm = data.bm
    this.color = data.color
  }
}
