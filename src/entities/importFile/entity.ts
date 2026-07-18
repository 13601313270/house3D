import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { ImportFileData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '@/utils/editItem'
import { MatchCircleArea } from '@/utils/matchArea'
import { OrigionSnapPoint } from '@/types/baseEntity'

export class ImportFileEntity extends PointEntityClass<ImportFileData> {
  name: string = '导入文件'
  type: string = 'importFile'
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  colorOpacity: string = '#14b737a5'
  private circleRadius = 6
  private baseDrawAngelLength = 40;
  img: HTMLImageElement = new Image()

  init(): Promise<void> {
    this.img.src = 'favicon.ico'
    return new Promise((resolve, reject) => {
      this.img.onload = () => {
        resolve()
      }
      this.img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
    })
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: ImportFileData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const angleY = data.angleY;// * -1 + Math.PI / 2
    const preImgScale = 1
    const { width, height } = this.img;
    ctx.save(); // 保存当前状态
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

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number
  ): void {
    const data = this.getData();
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

    const drawAngelLength = this.baseDrawAngelLength

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
    const circleRadius = this.circleRadius * zoomLevel + 3
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    ctx.beginPath()
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  create3DMesh(): THREE.Group[] {
    const data = this.getData();
    const group = new THREE.Group()
    const { fileTypeId, scale, isHidden } = data
    // console.log('zoomzoomzoom', isHidden)
    const findObjInfo = window.worldState.allImportFiles.find(item => item.fileTypeId === fileTypeId)

    if (isHidden) {
      return [];
    }
    if (!findObjInfo) {
      console.error('未找到对应的文件类型:', fileTypeId)
      return []
    }
    // @ts-ignore
    const threeObject = findObjInfo.mesh as THREE.Group | undefined;

    // 如果有预加载的本地模型对象，直接使用
    if (threeObject) {
      const clonedObject = threeObject.clone()
      // clonedObject.scale.set(scale, scale, scale)
      group.add(clonedObject)

      // 获取模型的尺寸
      const box = new THREE.Box3().setFromObject(clonedObject)
      const size = box.getSize(new THREE.Vector3())
      this.boxData[0].y = size.y * scale
      this.boxData[0].x = size.x * scale
      this.boxData[0].z = size.z * scale
      return [group]
    }

    return [
      group
    ]
  }

  // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  boxData: [THREE.Vector3, THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(10, 10, 10),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0)
  ]

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    return this.boxData
  }

  // 当前对象是否需要重新生成3D模型状态
  meshNeedChangeKey(): string {
    const cacheData = {
      ...this.getData(),
      x: undefined,
      y: undefined,
      z: undefined,
      angleY: undefined,
      scale: undefined,
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
      v.scale.set(data.scale, data.scale, data.scale)
    })
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    // console.log('dist', dist)
    if (dist < this.baseDrawAngelLength + this.circleRadius) {
      return new MatchCircleArea({ x: data.x, y: data.y, r: this.baseDrawAngelLength + this.circleRadius })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    // console.log('dist', dist)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    const drawAngelLength = this.baseDrawAngelLength
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength

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

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    const { x, y } = position
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

  inSceneSnapPointArea() {
    return false
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const { x, y, id } = this.getData()
    // 计算旋转后的点
    // const rotatedX = x * Math.cos(angleY) - y * Math.sin(angleY)
    // const rotatedY = x * Math.sin(angleY) + y * Math.cos(angleY)

    return [{
      objType: this.type,
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

  inSceneSnapLineArea() {
    return false
  }

  setPrepareState(x: number, y: number): string[] {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
    return [];
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    const configList: editItem[] = [
      {
        id: 'z',
        label: '高度',
        dataType: 'number',
        min: -100,
        max: 100,
        step: 1,
        value: data.z,
      },
      {
        id: 'scale',
        label: '缩放',
        dataType: 'number',
        min: 0.1,
        max: 10,
        step: 0.1,
        value: data.scale,
      },
      {
        id: 'isHidden',
        label: '是否隐藏',
        dataType: 'boolean',
        value: data.isHidden,
      }
    ]
    editShow(configList, (val) => {
      console.log('save-val', val)
      this.setData({
        ...this.getData(),
        ...val,
      })
    })
  }
}
