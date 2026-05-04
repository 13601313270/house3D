import { SphereData } from "./index.d"
import { ObjDataClass } from "../objData"

export class SphereDataClass extends ObjDataClass<SphereData> {
  r: number
  color: string
  mt: number | null

  constructor(data: SphereData) {
    super(data)
    this.r = data.r
    this.color = data.color
    this.mt = data.mt
  }
}