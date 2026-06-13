import { ConeData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class ConeDataClass extends PointObjDataClass<ConeData> {
  r: number
  h: number
  color: string
  mt: number | null

  constructor(data: ConeData) {
    super(data)
    this.r = data.r
    this.color = data.color
    this.h = data.h
    this.mt = data.mt
  }
}