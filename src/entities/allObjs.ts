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
}

type ImportFileType = {
  fileTypeId: string,
  mesh: THREE.Group,
  file: File
}

export type { ObjOutputFileType, ImportFileType }