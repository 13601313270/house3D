import { MaterialDate } from "@/material"
import * as THREE from 'three'
import woodMaterial from '../../src/material/wooden'

type ObjItem = {
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
}
const objFiles: ObjItem[] = [
  {
    id: 'bed',
    name: '单人床',
    url: 'https://video-obj.oss-cn-beijing.aliyuncs.com/bed.obj',
    scaleX: 2.7,
    scaleY: 2.7,
    scaleZ: 2.2,
    angleY: -Math.PI / 2,
    preImg: 'https://video-obj.oss-cn-beijing.aliyuncs.com/bed.png',
    preImgScale: 0.49,
    materialId: null,
    materialVec: [0, 1, 1],
    drawAngelLength: 70,
  },
  {
    id: 'table',
    name: '木质书桌',
    url: 'https://video-obj.oss-cn-beijing.aliyuncs.com/table.obj',
    scaleX: 0.1,
    scaleY: 0.1,
    scaleZ: 0.1,
    angleY: Math.PI / 2,
    preImg: 'https://video-obj.oss-cn-beijing.aliyuncs.com/table.png',
    preImgScale: 0.202,
    materialId: 3,
    materialVec: [0, 1, 1],
    drawAngelLength: 35,
  },
  {
    id: 'sofa',
    name: '沙发',
    url: 'https://video-obj.oss-cn-beijing.aliyuncs.com/sofa.obj',
    scaleX: 80,
    scaleY: 80,
    scaleZ: 80,
    angleY: 0,
    preImg: 'https://video-obj.oss-cn-beijing.aliyuncs.com/sofa.png',
    preImgScale: 0.287,
    materialId: null, // 14,
    materialVec: [0, 1, 1],
    drawAngelLength: 35,
  },
  {
    id: 'officeChair',
    name: '办公椅',
    url: 'https://video-obj.oss-cn-beijing.aliyuncs.com/office-chair.obj',
    materialUrl: 'https://video-obj.oss-cn-beijing.aliyuncs.com/office-chair.mtl',
    scaleX: 100,
    scaleY: 100,
    scaleZ: 100,
    angleY: 0,
    preImg: 'https://video-obj.oss-cn-beijing.aliyuncs.com/office-chair.png',
    preImgScale: 0.21,
    materialId: null, // 14,
    materialVec: [0, 1, 1],
    drawAngelLength: 35,
  },
  {
    id: 'monitor',
    name: '显示器',
    url: 'https://video-obj.oss-cn-beijing.aliyuncs.com/monitor.obj',
    materialUrl: 'https://video-obj.oss-cn-beijing.aliyuncs.com/monitor.mtl',
    scaleX: 10,
    scaleY: 10,
    scaleZ: 10,
    angleY: 0,
    preImg: 'https://video-obj.oss-cn-beijing.aliyuncs.com/monitor.png',
    preImgScale: 0.21,
    materialId: null, // 14,
    materialVec: [0, 1, 1],
    drawAngelLength: 25,
  },
]
export default objFiles
export type { ObjItem }