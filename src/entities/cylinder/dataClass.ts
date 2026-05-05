import { CylinderData } from "./index.d"
import { ObjDataClass } from "../objData"

export class CylinderDataClass extends ObjDataClass<CylinderData> {
  r: number
  h: number
  color: string
  mt: number | null

  constructor(data: CylinderData) {
    super(data)
    this.r = data.r
    this.color = data.color
    this.h = data.h
    this.mt = data.mt
  }
}