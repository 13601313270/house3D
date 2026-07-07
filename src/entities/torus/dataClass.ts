import { TorusData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class TorusDataClass extends PointObjDataClass<TorusData> {
  r: number
  t: number
  arc: number // 弧度
  thetaStart: number // 开始角度
  thetaLength: number // 结束角度
  color: string
  mt: number | null

  constructor(data: TorusData) {
    super(data)
    this.r = data.r
    this.t = data.t
    this.arc = data.arc
    this.thetaStart = data.thetaStart
    this.thetaLength = data.thetaLength
    this.color = data.color
    this.mt = data.mt
  }
}