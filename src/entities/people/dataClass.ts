import { PeopleData } from "./index.d"
import { ObjDataClass } from "../objData"

export class PeopleDataClass extends ObjDataClass<PeopleData> {
  angle: number
  height: number
  color: string
  bone?: Array<{
    name: string
    value: {
      x: number
      y: number
      z: number
      px: number
      py: number
      pz: number
    }
  }>

  constructor(data: PeopleData) {
    super(data)
    this.angle = data.angle
    this.height = data.height
    this.bone = data.bone || []
    this.color = data.color || '#DEDEDE'
  }
}