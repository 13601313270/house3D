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
import { MatchCircleArea } from '@/utils/matchArea'

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
  drawAngelLength: number = 40
  private circleRadius = 6

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
    const zoom = data.height / 170
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY); // 围绕新原点旋转
    ctx.drawImage(
      img,
      preImgScale / -2 * width * zoomLevel * zoom,
      preImgScale / -2 * height * zoomLevel * zoom,
      preImgScale * width * zoomLevel * zoom,
      preImgScale * height * zoomLevel * zoom
    ); // 以新原点为中心绘制
    ctx.restore(); // 恢复原始状态
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: PeopleData,
    panOffset: Point,
    zoomLevel: number
  ): void {
    const { angle: angleY } = data
    const angle = angleY * -1
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    const drawAngelLength = this.drawAngelLength

    // 控制点向着angle角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(angle) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(angle) * drawAngelLength

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
    ctx.arc(screenX, screenY, drawAngelLength * zoomLevel, angle * -1 - Math.PI / 4, angle * -1 + Math.PI / 4);
    ctx.stroke();

    // 左侧箭头
    (() => {
      ctx.beginPath()
      const [p1X, p1Y] = ttt(angle + 0.1 + Math.PI / 4, drawAngelLength)
      const [p2X, p2Y] = ttt(angle + Math.PI / 4, drawAngelLength + 5)
      const [p3X, p3Y] = ttt(angle + Math.PI / 4, drawAngelLength - 5)
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
    const [p1X, p1Y] = ttt(angle - 0.1 - Math.PI / 4, drawAngelLength)
    const [p2X, p2Y] = ttt(angle - Math.PI / 4, drawAngelLength + 5)
    const [p3X, p3Y] = ttt(angle - Math.PI / 4, drawAngelLength - 5)
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
    const circleRadius = this.circleRadius * zoomLevel + 3
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
      gltf.scene.traverse((child: any) => {
        if (child.isBone) {
          console.log(`🦴 发现骨骼: ${child.name}`);
          if (child.name === 'upper_armL') {
            child.rotation.z = Math.PI * -0.85
          }
          if (child.name === 'upper_armR') {
            child.rotation.z = Math.PI * 0.85
          }
        }
      });
      group.add(gltf.scene)
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
    const { height, angle } = data
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
      v.scale.set(singleHeight * height, singleHeight * height, singleHeight * height)
      v.rotation.set(0, angle * -1, 0)

      // v.traverse((child: any) => {
      //   console.log(`🦴 发现骨骼: ============`);
      //   if (child.isBone) {
      //     console.log(`🦴 发现骨骼: ${child.name}`);
      //   }
      // });
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
      angle: undefined,
    }
    return this.type + JSON.stringify(cacheData)
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    // console.log('dist', dist)
    if (dist < data.height * 0.3) {
      return new MatchCircleArea({ x: data.x, y: data.y, r: data.height * 0.3 })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const { angle } = data
    const angleY = angle * -1
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist: dist,
      }
    }
    // 控制点向着angle角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(angleY) * this.drawAngelLength
    const rotatedYAdd = data.y - Math.sin(angleY) * this.drawAngelLength

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
    // console.log('dist2', dist2)
    if (dist2 < this.circleRadius + 3) {
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
      this.setData({
        ...this.getData(),
        angle: angleY,
      })
    }
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
      {
        id: 'z',
        label: 'z',
        dataType: 'number',
        min: -100,
        max: 100,
        step: 1,
        value: data.z,
      }
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }
}
