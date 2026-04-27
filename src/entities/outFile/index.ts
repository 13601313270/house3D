import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { OutFileData } from './index.d'
import { EntityClass, EntityType, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
import { World } from '@/utils/world'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { ObjDataClass } from '../objData'

export class OutFileDataClass extends ObjDataClass<OutFileData> {
  url: string
  scale: number

  constructor(data: OutFileData) {
    super(data)
    this.url = data.url
    this.scale = data.scale
  }
}

export function createOutFileData(): OutFileDataClass {
  const data: OutFileData = {
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 100,
    url: 'https://video-obj.oss-cn-beijing.aliyuncs.com/bed.obj',
    scale: 1,
  }
  return new OutFileDataClass(data)
}

export function editPropConfig(): editItem[] {
  return [
    {
      id: 'url',
      label: 'URL',
      dataType: 'string',
    },
  ]
}

export class OutFileEntity extends EntityClass<OutFileData> {
  type: EntityType = 'outFile'
  isPointObj: boolean = true
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  colorOpacity: string = '#14b737a5'

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: OutFileData,
    panOffset: Point,
    zoomLevel: number
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 5 * zoomLevel, 0, Math.PI * 2)
    // alert(data.url)
    ctx.fill()
    ctx.stroke()
  }

  create3DMesh(scene: THREE.Scene): THREE.Group[] {
    const data = this.getData();
    const group = new THREE.Group()
    const { url, scale } = data

    if (url.endsWith('.obj')) {
      const loader = new OBJLoader()
      loader.load(url, (object: THREE.Group) => {
        // 计算模型的包围盒并居中
        const box = new THREE.Box3().setFromObject(object)
        const center = box.getCenter(new THREE.Vector3())

        // 将模型移动到原点
        object.position.sub(center)
        object.scale.setScalar(scale)

        // 添加默认材质（如果模型没有材质）
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (!child.material) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.7,
                metalness: 0.1
              })
            }
          }
        })
        group.add(object)
        console.log('OBJ文件加载成功:', url)
      }, (progress: any) => {
        // 加载进度
        const percent = (progress.loaded / progress.total * 100).toFixed(2)
        console.log('加载进度:', percent + '%')
      }, (error: any) => {
        console.error('OBJ文件加载失败:', error)
      })
    }
    group.position.set(data.x, data.z, data.y)

    return [
      group
    ]
  }

  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    console.log('dist', dist)
    if (dist < 10 * zoomLevel) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo) {
    this.changePosition({ x, y })
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    return false
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const data = this.getData();
    return [{
      objType: this.type,
      objId: data.id,
      snapFromType: 'point',
      point: {
        index: 0,
        x: data.x,
        y: data.y,
      },
    }]
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  afterBeSnapByLine(obj: EntityClass<OutFileData>, line: [Point, Point]) {
  }

  setPrepareState(x: number, y: number): void {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
  }
}
