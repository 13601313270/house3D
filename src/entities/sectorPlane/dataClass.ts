import { SectorPlaneData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class SectorPlaneDataClass extends PointObjDataClass<SectorPlaneData> {
  r: number
  color: string
  mt: number | null
  startAngle: number // 开始角度
  endAngle: number // 结束角度
  ds: boolean // 是否双面可见
  img: string // 图片

  constructor(data: SectorPlaneData) {
    super(data)
    this.r = data.r
    this.color = data.color
    this.mt = data.mt
    this.startAngle = data.startAngle
    this.endAngle = data.endAngle
    this.ds = data.ds
    this.img = data.img
  }
}