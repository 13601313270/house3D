import { CirclePlaneData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class PlaneDataClass extends PointObjDataClass<CirclePlaneData> {
  r: number
  color: string
  mt: number | null
  img?: string // 图片
  ds: boolean // 是否双面可见
  angleY: number // 旋转角度Y

  constructor(data: CirclePlaneData) {
    super(data)
    this.r = data.r
    this.color = data.color
    this.mt = data.mt
    this.img = data.img
    this.ds = data.ds
    this.angleY = data.angleY || 0
  }
}