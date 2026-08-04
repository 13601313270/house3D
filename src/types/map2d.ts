export interface Point {
  x: number
  y: number
}

export interface PointWithIndex extends Point {
  index: number
}

export interface HandelInfo {
  id: string // 对象ID
  type: string
  icon?: 'move' | 'angel',//  图标
  index: number,// 对象内具柄index
  info?: any
  dist: number,
}

export interface BaseObjData {
  id: string
  tip?: string,// 提示信息
  tipFontSize?: number,// 提示信息字号
  isLocked?: boolean,// 是否锁定，无法被移动
  isHidden?: boolean,// 是否隐藏
}

// 点状对象数据基类
export interface PointObjData extends BaseObjData {
  x: number
  y: number
  z: number
}

export interface PointCanAngleObjData extends PointObjData {
  angleY: number// 旋转角度Y
}

// 链状对象数据基类
export interface LineObjData<T> extends BaseObjData {
  points: (Point & T)[]
}

export interface ObjInWallData extends PointObjData {
  wallId?: string // 所属墙ID，如果没有磁吸在墙上，为undefined
  wallPointId: number // 门在墙上的点的索引（比如0，代表从0到1的墙面上，-1代表未磁吸在墙上）
  bottom: number // 距离地面
  angle: number
}