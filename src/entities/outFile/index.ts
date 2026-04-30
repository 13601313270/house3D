import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { OutFileData } from './index.d'
import { EntityClass, EntityType, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// @ts-ignore
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

import { ObjDataClass } from '../objData'
import { getMaterialById } from '@/material'

export class OutFileDataClass extends ObjDataClass<OutFileData> {
  fileTypeId: string
  angleY: number
  bm: number | null // 材质

  constructor(data: OutFileData) {
    super(data)
    this.fileTypeId = data.fileTypeId
    this.angleY = data.angleY
    this.bm = data.bm
  }
}

export function createOutFileData(): OutFileDataClass {
  // @ts-ignore
  const findObjInfo = window.ObjFiles[0];
  const data: OutFileData = {
    fileTypeId: findObjInfo.id,
    id: Date.now().toString(),
    angleY: 0,
    bm: null,
    x: 0,
    y: 0,
    z: 0,
  }
  return new OutFileDataClass(data)
}

export class OutFileEntity extends EntityClass<OutFileData> {
  type: EntityType = 'outFile'
  isPointObj: boolean = true
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  colorOpacity: string = '#14b737a5'
  private baseDrawAngelLength = 40;
  img: HTMLImageElement = new Image()

  init(): Promise<void> {
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === this.getData().fileTypeId)
    const preImg = findObjInfo?.preImg || ''
    this.img.src = preImg
    return new Promise((resolve, reject) => {
      this.img.onload = () => {
        resolve()
      }
      this.img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
    })
  }

  defaultValue(): OutFileData {
    return createOutFileData()
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: OutFileData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const angleY = data.angleY;// * -1 + Math.PI / 2
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === data.fileTypeId)
    const preImgScale = findObjInfo?.preImgScale || 1
    ctx.save(); // 保存当前状态
    const { width, height } = this.img;
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY * -1); // 围绕新原点旋转
    ctx.drawImage(
      this.img,
      preImgScale / -2 * width * zoomLevel,
      preImgScale / -2 * height * zoomLevel,
      preImgScale * width * zoomLevel,
      preImgScale * height * zoomLevel
    ); // 以新原点为中心绘制
    ctx.restore(); // 恢复原始状态
  }

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

    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === data.fileTypeId)
    const drawAngelLength = findObjInfo?.drawAngelLength || this.baseDrawAngelLength

    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength

    function ttt(angel: number, drawAngelLength: number) {
      const tempX = data.x + Math.cos(angel) * drawAngelLength;
      const tempY = data.y - Math.sin(angel) * drawAngelLength;
      return [tempX * zoomLevel + panOffset.x, tempY * zoomLevel + panOffset.y]
    }

    // 绘制双向箭头表示旋转角度
    ctx.strokeStyle = '#e67e22'
    ctx.fillStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    // 绘制双向箭头的主线（圆弧）
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawAngelLength * zoomLevel, data.angleY * -1 - Math.PI / 4, data.angleY * -1 + Math.PI / 4);
    ctx.stroke();

    // 左侧箭头
    (() => {
      ctx.beginPath()
      const [p1X, p1Y] = ttt(data.angleY + 0.1 + Math.PI / 4, drawAngelLength)
      const [p2X, p2Y] = ttt(data.angleY + Math.PI / 4, drawAngelLength + 5)
      const [p3X, p3Y] = ttt(data.angleY + Math.PI / 4, drawAngelLength - 5)
      ctx.moveTo(
        p1X,
        p1Y
      )
      ctx.lineTo(p2X, p2Y)
      ctx.lineTo(p3X, p3Y)
      ctx.closePath()
      ctx.fill()
    })();

    // 右侧箭头
    ctx.beginPath()
    const [p1X, p1Y] = ttt(data.angleY - 0.1 - Math.PI / 4, drawAngelLength)
    const [p2X, p2Y] = ttt(data.angleY - Math.PI / 4, drawAngelLength + 5)
    const [p3X, p3Y] = ttt(data.angleY - Math.PI / 4, drawAngelLength - 5)
    ctx.moveTo(
      p1X,
      p1Y
    )
    ctx.lineTo(p2X, p2Y)
    ctx.lineTo(p3X, p3Y)
    ctx.closePath()
    ctx.fill()

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
  }

  create3DMesh(scene: THREE.Scene): THREE.Group[] {
    const data = this.getData();
    const group = new THREE.Group()
    const { fileTypeId, bm } = data
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === fileTypeId)

    if (!findObjInfo) {
      console.error('未找到对应的文件类型:', fileTypeId)
      return []
    }
    const { scaleX, scaleY, scaleZ, url, materialUrl, angleY, materialVec } = findObjInfo
    // console.log('materialId', bm);
    const materialId = bm === null ? (findObjInfo.materialId || -1) : bm
    console.log('scaleX', scaleX, 'scaleY', scaleY, 'scaleZ', scaleZ)
    if (url.endsWith('.obj')) {
      const loader = new OBJLoader()
      const materLoader = new MTLLoader()

      // 将方向向量旋转90度
      const rotatedDirection = materialVec ? new THREE.Vector3(...materialVec) : new THREE.Vector3(-1, 1, 1)
      const material = getMaterialById(materialId)?.material(rotatedDirection) || new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.7,
        metalness: 0.1
      })
      function render(object: THREE.Group) {
        object.scale.set(scaleX, scaleY, scaleZ)
        object.rotation.y = angleY
        // @ts-ignore
        object.material = material

        // 添加默认材质（如果模型没有材质）
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (materialId !== -1) {
              child.material = material
            } else {
              if (!child.material) {
                child.material = material
              }
            }
          }
        })
        group.add(object)
        console.log('OBJ文件加载成功:', url)
      }
      // console.log('material-material', getMaterialById(materialId))
      if (materialUrl) {
        materLoader.load(materialUrl, (mtl: any) => {
          mtl.preload();
          loader.setMaterials(mtl);
          loader.load(url, (object: THREE.Group) => {
            render(object)
          }, (progress: any) => {
            // 加载进度
            const percent = (progress.loaded / progress.total * 100).toFixed(2)
            console.log('加载进度:', percent + '%')
          }, (error: any) => {
            console.error('OBJ文件加载失败:', error)
          })
        })
      } else {
        loader.load(url, (object: THREE.Group) => {
          render(object)
        }, (progress: any) => {
          // 加载进度
          const percent = (progress.loaded / progress.total * 100).toFixed(2)
          console.log('加载进度:', percent + '%')
        }, (error: any) => {
          console.error('OBJ文件加载失败:', error)
        })
      }
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

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    console.log('dist', dist)
    if (dist < 10) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist: dist,
      }
    }
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === data.fileTypeId)
    const drawAngelLength = findObjInfo?.drawAngelLength || this.baseDrawAngelLength
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
    console.log('dist2', dist2)
    if (dist2 < 10) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: dist2,
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

  inSceneSnapLineArea(obj: EntityClass<OutFileData>, line: [Point, Point]) {
    return false
  }

  setPrepareState(x: number, y: number): void {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    const configList: editItem[] = [
      {
        id: 'bm',
        label: '材质',
        dataType: 'material',
        value: data.bm,
      },
      {
        id: 'z',
        label: '高度',
        dataType: 'number',
        min: 0,
        max: 100,
        step: 1,
        value: data.z,
      }
    ]
    editShow(configList, (val) => {
      this.setData({
        ...this.getData(),
        ...val,
      })
    })
  }
}
