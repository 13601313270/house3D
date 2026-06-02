import { PeopleData } from "./index.d"
import { ObjDataClass } from "../objData"

export class PeopleDataClass extends ObjDataClass<PeopleData> {
  angle: number
  height: number
  bone?: Array<{
    name: string
    value: {
      x: number
      y: number
      z: number
    }
  }>

  constructor(data: PeopleData) {
    super(data)
    this.angle = data.angle
    this.height = data.height
    this.bone = data.bone || []
  }
}