import { SectorData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class SectorDataClass extends PointObjDataClass<SectorData> {
  r: number
  h: number
  color: string
  mt: number | null
  startAngle: number // 开始角度
  endAngle: number // 结束角度

  constructor(data: SectorData) {
    super(data)
    this.r = data.r
    this.color = data.color
    this.h = data.h
    this.mt = data.mt
    this.startAngle = data.startAngle
    this.endAngle = data.endAngle
  }
}