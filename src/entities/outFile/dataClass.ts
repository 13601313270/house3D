import { OutFileData } from "./index.d"
import { PointObjDataClass } from "../objData"

export class OutFileDataClass extends PointObjDataClass<OutFileData> {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质
  color: string
  canAngelZ: boolean// 是否可以旋转Z轴角度
  zoom: number// 自定义缩放
  data?: Record<string, any>

  constructor(data: OutFileData) {
    super(data)
    this.fileTypeId = data.fileTypeId
    this.angleY = data.angleY
    this.bm = data.bm
    this.color = data.color
    this.canAngelZ = data.canAngelZ
    this.zoom = data.zoom || 1
    this.data = data.data || {}
  }
}