import { WindowData } from "./index.d"
import { ObjInWallDataClass } from "../objData"

export class WindowDataClass extends ObjInWallDataClass<WindowData> {
  width: number
  height: number
  angle: number
  bqc: string // 包墙颜色
  bmt: number // 包墙材质
  tc: string // 门框颜色
  tmt: number // 门框材质
  ic: string // 玻璃框颜色
  icmt: number // 玻璃框材质
  hasBorder: boolean // 是否有门框
  rightOpenAngle: number // 右门打开角度
  leftOpenAngle: number // 左门打开角度
  constructor(data: WindowData) {
    super(data)
    this.wallId = data.wallId
    this.wallPointId = data.wallPointId
    this.width = data.width
    this.height = data.height
    this.angle = data.angle
    this.bottom = data.bottom
    this.bqc = data.bqc
    this.bmt = data.bmt
    this.tc = data.tc
    this.tmt = data.tmt
    this.ic = data.ic
    this.icmt = data.icmt
    this.hasBorder = data.hasBorder
    this.rightOpenAngle = data.rightOpenAngle
    this.leftOpenAngle = data.leftOpenAngle
  }
}