import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { OutFileData } from './index.d'
import { EntityClass, EntityType, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
import { World } from '@/utils/world'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { ObjDataClass } from '../objData'
import ObjFiles from '../allObjs'

export class OutFileDataClass extends ObjDataClass<OutFileData> {
  fileTypeId: string
  angleY: number

  constructor(data: OutFileData) {
    super(data)
    this.fileTypeId = data.fileTypeId
    this.angleY = data.angleY
  }
}

export function createOutFileData(): OutFileDataClass {
  const findObjInfo = ObjFiles[0];
  const data: OutFileData = {
    fileTypeId: findObjInfo.id,
    id: Date.now().toString(),
    angleY: 0,
    x: 0,
    y: 0,
    z: 0,
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
    ctx.fill()
    ctx.stroke()

    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * 50
    const rotatedYAdd = data.y - Math.sin(data.angleY) * 50
    // 绘制双向箭头表示旋转角度
    const arrowX = rotatedXAdd * zoomLevel + panOffset.x
    const arrowY = rotatedYAdd * zoomLevel + panOffset.y
    const arrowSize = 8 * zoomLevel
    const perpAngle = data.angleY + Math.PI / 2

    // 在(rotatedXAdd, rotatedYAdd)位置绘制一个圆圈
    const circleX = rotatedXAdd * zoomLevel + panOffset.x
    const circleY = rotatedYAdd * zoomLevel + panOffset.y
    const circleRadius = 5 * zoomLevel
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    ctx.beginPath()
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.strokeStyle = '#e67e22'
    ctx.fillStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel

    // 绘制双向箭头的主线
    ctx.beginPath()
    ctx.moveTo(arrowX - Math.cos(data.angleY) * arrowSize * 1.5, arrowY - Math.sin(data.angleY) * arrowSize * 1.5)
    ctx.lineTo(arrowX + Math.cos(data.angleY) * arrowSize * 1.5, arrowY + Math.sin(data.angleY) * arrowSize * 1.5)
    ctx.stroke()

    // 左侧箭头
    ctx.beginPath()
    ctx.moveTo(arrowX - Math.cos(data.angleY) * arrowSize * 1.5, arrowY - Math.sin(data.angleY) * arrowSize * 1.5)
    ctx.lineTo(arrowX - Math.cos(data.angleY) * arrowSize + Math.cos(perpAngle) * arrowSize * 0.5, arrowY - Math.sin(data.angleY) * arrowSize + Math.sin(perpAngle) * arrowSize * 0.5)
    ctx.lineTo(arrowX - Math.cos(data.angleY) * arrowSize - Math.cos(perpAngle) * arrowSize * 0.5, arrowY - Math.sin(data.angleY) * arrowSize - Math.sin(perpAngle) * arrowSize * 0.5)
    ctx.closePath()
    ctx.fill()

    // 右侧箭头
    ctx.beginPath()
    ctx.moveTo(arrowX + Math.cos(data.angleY) * arrowSize * 1.5, arrowY + Math.sin(data.angleY) * arrowSize * 1.5)
    ctx.lineTo(arrowX + Math.cos(data.angleY) * arrowSize + Math.cos(perpAngle) * arrowSize * 0.5, arrowY + Math.sin(data.angleY) * arrowSize + Math.sin(perpAngle) * arrowSize * 0.5)
    ctx.lineTo(arrowX + Math.cos(data.angleY) * arrowSize - Math.cos(perpAngle) * arrowSize * 0.5, arrowY + Math.sin(data.angleY) * arrowSize - Math.sin(perpAngle) * arrowSize * 0.5)
    ctx.closePath()
    ctx.fill()
  }

  create3DMesh(scene: THREE.Scene): THREE.Group[] {
    const data = this.getData();
    const group = new THREE.Group()
    const { fileTypeId } = data

    const findObjInfo = ObjFiles.find(item => item.id === fileTypeId)

    if (!findObjInfo) {
      console.error('未找到对应的文件类型:', fileTypeId)
      return []
    }
    const { scaleX, scaleY, scaleZ, url } = findObjInfo
    console.log('scaleX', scaleX, 'scaleY', scaleY, 'scaleZ', scaleZ)
    if (url.endsWith('.obj')) {
      const loader = new OBJLoader()
      loader.load(url, (object: THREE.Group) => {
        // 计算模型的包围盒并居中
        const box = new THREE.Box3().setFromObject(object)
        const center = box.getCenter(new THREE.Vector3())

        // 将模型移动到原点
        // object.position.sub(center)
        object.scale.set(scaleX, scaleY, scaleZ)

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
    // group.position.set(data.x, data.z, data.y)

    return [
      group
    ]
  }

  // 当前对象是否需要重新生成3D模型状态
  meshNeedChangeKey(): string {
    const cacheData = {
      ...this.getData(),
      x: undefined,
      y: undefined,
      z: undefined,
      angleY: undefined,
    }
    // console.log('dddd', this.type + JSON.stringify(cacheData))
    return this.type + JSON.stringify(cacheData)
  }

  // 改变3D模型的状态
  // 例如：改变位置，旋转角度等，模型本身不变
  change3DMeshState(): void {
    const data = this.getData();
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
      v.rotation.y = data.angleY
    })
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
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * 50
    const rotatedYAdd = data.y - Math.sin(data.angleY) * 50

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
    console.log('dist2', dist2)
    if (dist2 < 10 * zoomLevel) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo) {
    if (matchHandelInfo.index === 0) {
      this.changePosition({ x, y })
    } else if (matchHandelInfo.index === 1) {
      const data = this.getData();
      // 根据x,y计算angleY
      const angleY = Math.atan2(y - data.y, x - data.x)
      console.log(angleY)
      this.setData({
        ...this.getData(),
        angleY: angleY * -1,
      })
    }
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    return false
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const { x, y, angleY, id } = this.getData()
    // 计算旋转后的点
    const rotatedX = x * Math.cos(angleY) - y * Math.sin(angleY)
    const rotatedY = x * Math.sin(angleY) + y * Math.cos(angleY)

    return [{
      objType: this.type,
      objId: id,
      snapFromType: 'point',
      point: {
        index: 0,
        x,
        y,
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
