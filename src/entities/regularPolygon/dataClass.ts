import { RegularPolygonData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class RegularPolygonDataClass extends PointObjDataClass<RegularPolygonData> {
  n: number
  r: number
  h: number
  color: string
  // mt: number | null // 多边形平面材质
  angleY: number

  constructor(data: RegularPolygonData) {
    super(data)
    this.n = data.n
    this.r = data.r
    this.h = data.h
    this.color = data.color
    // this.mt = data.mt
    this.angleY = data.angleY
  }
}