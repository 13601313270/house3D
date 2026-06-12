import { PointObjData, LineObjData, ObjInWallData, Point } from "@/types/map2d"

class PointObjDataClass<T extends PointObjData> {
  id: string
  x: number
  y: number
  z: number
  tip?: string // 提示信息
  tipFontSize?: number // 提示信息字号

  constructor(data: T) {
    this.id = data.id
    this.x = data.x
    this.y = data.y
    this.z = data.z
    this.tip = data.tip || ''
    this.tipFontSize = data.tipFontSize || 96
  }
}

class LineObjDataClass<V, T extends LineObjData<V>> {
  id: string
  points: (Point & V)[]
  tip?: string // 提示信息
  tipFontSize?: number // 提示信息字号

  constructor(data: T) {
    this.id = data.id
    this.points = data.points || []
    this.tip = data.tip || ''
    this.tipFontSize = data.tipFontSize || 96
  }
}

class ObjInWallDataClass<T extends ObjInWallData> extends PointObjDataClass<T> {
  wallId?: string // 所属墙ID，如果没有磁吸在墙上，为undefined
  wallPointId: number // 门在墙上的点的索引（比如0，代表从0到1的墙面上，-1代表未磁吸在墙上）
  bottom: number // 距离墙面底部的距离
  angle: number // 门角度

  constructor(data: T) {
    super(data)
    this.wallPointId = data.wallPointId
    this.wallId = data.wallId
    this.bottom = data.bottom
    this.angle = data.angle
  }
}

export {
  PointObjDataClass as ObjDataClass,
  LineObjDataClass,
  ObjInWallDataClass
}