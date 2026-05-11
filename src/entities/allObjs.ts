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
}

type ImportFileType = {
  fileTypeId: string,
  mesh: THREE.Group,
  file: File
}

export type { ObjOutputFileType, ImportFileType }