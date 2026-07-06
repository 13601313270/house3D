import { RegularPolygonPlaneData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class RegularPolygonPlaneDataClass extends PointObjDataClass<RegularPolygonPlaneData> {
  n: number
  r: number
  height: number
  color: string
  // mt: number | null // 多边形平面材质
  angleY: number

  constructor(data: RegularPolygonPlaneData) {
    super(data)
    this.n = data.n
    this.r = data.r
    this.height = data.height
    this.color = data.color
    // this.mt = data.mt
    this.angleY = data.angleY
  }
}