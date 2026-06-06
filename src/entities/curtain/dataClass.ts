import { CurtainData } from "./index.d"
import { ObjDataClass } from "../objData"

export class CurtainDataClass extends ObjDataClass<CurtainData> {
  width: number
  height: number
  color: string
  mt: number | null
  angleY: number // 旋转角度

  constructor(data: CurtainData) {
    super(data)
    this.width = data.width
    this.height = data.height
    this.color = data.color
    this.mt = data.mt
    this.angleY = data.angleY || 0
  }
}