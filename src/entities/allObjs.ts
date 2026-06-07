import * as THREE from 'three'

type ObjOutputFileType = {
  id: string
  name: string
  url: string
  materialUrl?: string
  scaleX: number
  scaleY: number
  scaleZ: number
  angleY: number
  preImg: string
  preImgScale: number
  materialId: number | null
  materialVec?: [number, number, number]
  drawAngelLength: number
  defaultColor: string
  inWall: boolean
  defaultZ: number
  canAngelZ: boolean,// 是否可以旋转Z轴角度
  matchAreaType: 1 | 2,// 1方形 2圆形
  matchAreaNumber1: number, // 方形代表宽，圆形代表半径
  matchAreaNumber2: number,// 方形代表宽，圆形无
  matchAreaDepth: number, // 方形代表高，圆形无
  matchAreaOffsetX: number, // 占地范围数字offsetX
  matchAreaOffsetY: number, // 占地范围数字offsetY
  drawAngelAngel: number, // 旋转角度具柄的初始角度
}

type ImportFileType = {
  fileTypeId: string,
  mesh: THREE.Group | THREE.Mesh,
  file: File
}

const importImgFileHead = 'importImg_'

type ImportImgType = {
  fileTypeId: string,
  file: File,
}

export {
  importImgFileHead
}

export type {
  ObjOutputFileType,
  ImportFileType,
  ImportImgType
}