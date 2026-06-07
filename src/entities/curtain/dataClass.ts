import { CurtainData } from "./index.d"
import { ObjDataClass } from "../objData"

export class CurtainDataClass extends ObjDataClass<CurtainData> {
  width: number
  height: number
  angleY: number // 旋转角度
  img: string

  constructor(data: CurtainData) {
    super(data)
    this.width = data.width
    this.height = data.height
    this.angleY = data.angleY || 0
    this.img = data.img
  }
}