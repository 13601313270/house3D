import { SignData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class SignDataClass extends PointObjDataClass<SignData> {
  angleY: number // 旋转角度
  value: Array<any> // 图片数据（JSON格式）
  viewImg: string // 图片数据（JSON格式）
  constructor(data: SignData) {
    super(data)
    this.angleY = data.angleY
    this.value = data.value || []
    this.viewImg = data.viewImg || '[]'
  }
}
