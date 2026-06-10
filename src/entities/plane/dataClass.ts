import { PlaneData } from "./index.d"
import { ObjDataClass } from "../objData"

export class PlaneDataClass extends ObjDataClass<PlaneData> {
  width: number
  length: number
  color: string
  mt: number | null
  angleY: number // 旋转角度
  img?: string // 图片

  constructor(data: PlaneData) {
    super(data)
    this.width = data.width
    this.length = data.length
    this.color = data.color
    this.mt = data.mt
    this.angleY = data.angleY || 0
    this.img = data.img
  }
}