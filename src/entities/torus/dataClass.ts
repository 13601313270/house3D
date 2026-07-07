import { TorusData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class TorusDataClass extends PointObjDataClass<TorusData> {
  r: number
  t: number
  color: string
  mt: number | null

  constructor(data: TorusData) {
    super(data)
    this.r = data.r
    this.t = data.t
    this.color = data.color
    this.mt = data.mt
  }
}