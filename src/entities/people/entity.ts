import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { PeopleData } from './index.d'
import { EntityClass, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// @ts-ignore
import kamera from './kamera.png'
import { PeopleDataClass } from './dataClass'

const img = new Image()
img.src = 'people.png'

export class PeopleEntity extends EntityClass<PeopleData> {
  type: string = 'people'
  isPointObj: boolean = true
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  color3DActive: string = 'red'
  colorOpacity: string = '#14b737a5'
  colorOpacityActive: string = 'red'
  active: boolean = false // 这个不存在数据库里，只是在前端动态调整

  defaultValue(): PeopleData {
    const people: PeopleData = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      angle: 0,
      height: 170,
    }
    return new PeopleDataClass(people)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: PeopleData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const angleY = data.angle
    const preImgScale = 0.24
    ctx.save(); // 保存当前状态
    const { width, height } = img;
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY); // 围绕新原点旋转
    ctx.drawImage(
      img,
      preImgScale / -2 * width * zoomLevel,
      preImgScale / -2 * height * zoomLevel,
      preImgScale * width * zoomLevel,
      preImgScale * height * zoomLevel
    ); // 以新原点为中心绘制
    ctx.restore(); // 恢复原始状态
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: PeopleData,
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
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  create3DMesh(scene: THREE.Scene): THREE.Group[] {
    const data = this.getData();
    const loader = new GLTFLoader()
    const group = new THREE.Group()
    // 将方向向量旋转90度
    // const material = new THREE.MeshStandardMaterial({
    //   color: 0x888888,
    //   roughness: 0.7,
    //   metalness: 0.1
    // })
    loader.load('./ManClean.glb', (gltf: any) => {
      gltf.scene.rotateX(Math.PI);  // 如果需要绕 X 轴翻转 180 度
      gltf.scene.rotateY(Math.PI)
      gltf.scene.rotateZ(Math.PI);  // 如果需要绕 Y 轴翻转 180 度
      group.add(gltf.scene)
      // console.log('OBJ文件加载成功:', url)
    }, (progress: any) => {
      // 加载进度
      const percent = (progress.loaded / progress.total * 100).toFixed(2)
      console.log('加载进度:', percent + '%')
    }, (error: any) => {
      console.error('OBJ文件加载失败:', error)
    })
    return [
      group
    ]
  }

  change3DMeshState(): void {
    const data = this.getData();
    const singleHeight = 0.213
    const { height } = data
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
      v.scale.set(singleHeight * height, singleHeight * height, singleHeight * height)
    })
  }

  // 当前对象是否需要重新生成3D模型状态
  meshNeedChangeKey(): string {
    const cacheData = {
      ...this.getData(),
      x: undefined,
      y: undefined,
      z: undefined,
      height: undefined,
    }
    return this.type + JSON.stringify(cacheData)
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < 10) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist: dist,
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

  inSceneSnapLineArea(obj: EntityClass<PeopleData>, line: [Point, Point]) {
    return false;
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
    editShow([
      {
        id: 'height',
        label: '身高',
        dataType: 'number',
        min: 0,
        max: 500,
        step: 15,
        value: data.height,
      },
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }
}
