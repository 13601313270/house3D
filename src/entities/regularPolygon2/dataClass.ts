import { RegularPolygon2Data } from "./index.d"
import { PointObjDataClass } from "../objData"

export class RegularPolygonDataClass extends PointObjDataClass<RegularPolygon2Data> {
  n: number
  r: number
  r2: number
  h: number
  color: string
  // mt: number | null // 多边形平面材质
  angleY: number

  constructor(data: RegularPolygon2Data) {
    super(data)
    this.n = data.n
    this.r = data.r
    this.r2 = data.r2
    this.h = data.h
    this.color = data.color
    // this.mt = data.mt
    this.angleY = data.angleY
  }
}