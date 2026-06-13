import { OutFileData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class OutFileDataClass extends PointObjDataClass<OutFileData> {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质
  color: string
  canAngelZ: boolean// 是否可以旋转Z轴角度

  constructor(data: OutFileData) {
    super(data)
    this.fileTypeId = data.fileTypeId
    this.angleY = data.angleY
    this.bm = data.bm
    this.color = data.color
    this.canAngelZ = data.canAngelZ
  }
}