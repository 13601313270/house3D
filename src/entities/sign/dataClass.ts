import { SignData } from "./index.d"
import { PointObjDataClass } from "../objData"
import { CanvasShape } from "@/components/GroundTextureEditor/renderer"

export class SignDataClass extends PointObjDataClass<SignData> {
  angleY: number // 旋转角度
  width: number // 大小
  height: number // 大小
  signZ: number // 牌子离地高度
  poleRadius: number // 柱子半径
  bgColor: string // 背景颜色
  poleColor: string // 柱子颜色
  shape: CanvasShape // 形状
  img: {
    value: Array<any> // 图片数据（JSON格式）
    viewImg: string // 图片数据（JSON格式）
  }

  constructor(data: SignData) {
    super(data)
    this.angleY = data.angleY
    this.width = data.width
    this.height = data.height
    this.signZ = data.signZ
    this.poleRadius = data.poleRadius
    this.bgColor = data.bgColor
    this.poleColor = data.poleColor
    this.shape = data.shape
    this.img = data.img
  }
}
