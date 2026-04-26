import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { OutFileData } from './index.d'
import { EntityClass, EntityType, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
import { World } from '@/utils/world'
import { ObjDataClass } from '../objData'

export class OutFileDataClass extends ObjDataClass<OutFileData> {
  targetPositionX: number
  targetPositionY: number
  targetPositionZ: number
  fov: number
  aspectW: number
  aspectH: number
  constructor(data: OutFileData) {
    super(data)
    this.targetPositionX = 0
    this.targetPositionY = 0
    this.targetPositionZ = 100
    this.fov = 55
    this.aspectW = 9
    this.aspectH = 16
  }
}
export function createOutFileData(): OutFileDataClass {
  const camera: OutFileData = {
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 100,
    url: '',
  }
  return new OutFileDataClass(camera)
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
    // 添加一个方块
    const cube = new THREE.BoxGeometry(100, 100, 100)
    const material = new THREE.MeshBasicMaterial({ color: this.color3D })
    const cubeMesh = new THREE.Mesh(cube, material)
    cubeMesh.position.set(data.x, data.z, data.y)
    group.add(cubeMesh)

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
