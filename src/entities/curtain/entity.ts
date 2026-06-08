import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { CurtainData } from './index.d'
import { EntityClass, MatchSnapPoint } from '@/types/entity'
import { editItem } from '..';
import { CurtainDataClass } from './dataClass'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect';
import { MatchRectArea } from '@/utils/matchArea';
import { importImgFileHead } from '../allObjs';

export class CurtainEntity extends EntityClass<CurtainData> {
  name: string = '方形'
  type: string = 'curtain'
  isPointObj: boolean = true
  private circleRadius = 6
  private depth = 5
  private static textureLoader = new THREE.TextureLoader();
  private static textureCache = new Map<string | File, THREE.Texture>();

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: CurtainData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { width } = data;
    const angleY = data.angleY || 0;// 历史数据问题

    // 绘制一个方块
    ctx.fillStyle = '#be4141'
    ctx.save(); // 保存当前状态
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY * -1); // 围绕新原点旋转
    // 绘制一个方块
    ctx.fillRect(
      width / -2 * zoomLevel,
      this.depth / -2 * zoomLevel,
      width * zoomLevel,
      this.depth * zoomLevel
    )
    ctx.restore(); // 恢复原始状态
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: CurtainData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const angleY = data.angleY || 0;

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    const drawAngelLength = Math.max(this.getData().width / 2, this.circleRadius * 2);

    const basicX = data.x * zoomLevel + panOffset.x
    const basicY = data.y * zoomLevel + panOffset.y

    ctx.font = `${Math.max(14 * zoomLevel, 14)}px '微软雅黑'`
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = 'white'
    ctx.fillStyle = 'black'
    const text = `${Math.round(this.getData().width).toString()}×${Math.round(this.getData().height).toString()}`
    ctx.strokeText(text, basicX, basicY)
    ctx.fillText(text, basicX, basicY)

    const rotatedXAdd = Math.cos(angleY) * drawAngelLength * zoomLevel
    const rotatedYAdd = Math.sin(angleY) * drawAngelLength * zoomLevel

    // 控制点向着angleY角度延伸10个单位后的坐标
    const circleRadius = this.circleRadius * zoomLevel + 3
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    ctx.beginPath()
    ctx.arc(basicX + rotatedXAdd, basicY - rotatedYAdd, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()

    ctx.beginPath()
    ctx.arc(basicX - rotatedXAdd, basicY + rotatedYAdd, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
  }

  glbObj: THREE.Group | null = null;

  create3DMesh(scene: THREE.Scene) {
    const data = this.getData();
    const group = new THREE.Group()
    const { width, height, img } = data;
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值
    let material: THREE.MeshStandardMaterial | null = null;
    let texture = CurtainEntity.textureCache.get(img);
    if (!texture) {
      if (img.startsWith(importImgFileHead)) {
        const findImportFile = this.world.allImportImgs.find(item => item.fileTypeId === img);
        if (findImportFile) {
          const imgFile: File = findImportFile.file as File;
          const objectUrl = URL.createObjectURL(imgFile);
          texture = CurtainEntity.textureLoader.load(objectUrl);
          CurtainEntity.textureCache.set(img, texture);
        }
      } else {
        texture = CurtainEntity.textureLoader.load(img);
        CurtainEntity.textureCache.set(img, texture);
      }
    }
    material = new THREE.MeshStandardMaterial({ map: texture, color: '#ffffff' });
    if (material) {
      material.side = THREE.DoubleSide;
    }
    const plane = new THREE.PlaneGeometry(width, height)
    const planeMesh = new THREE.Mesh(plane, material!)
    // planeMesh.rotation.x = -Math.PI / 2
    planeMesh.position.setY(height / 2)
    group.add(planeMesh)
    group.rotateY(angleY);
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { width, height, angleY } = this.getData();
    return [
      new THREE.Vector3(width, height, this.depth),
      new THREE.Vector3(0, height / 2, 0),
      new THREE.Vector3(0, angleY, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    // const dist = Math.hypot(x - data.x, y - data.y)
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值
    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: data.width + 30,
      depth: this.depth + 30,
      angleY: angleY * -1,
    })) {
      return new MatchRectArea({
        x: data.x,
        y: data.y,
        width: data.width,
        depth: this.depth,
        angleY: angleY,
      })
    }
    return null;
  }

  beforeMatchHandleSaveData: {
    centerOffset: {
      x: number,
      y: number,
    },
    dragPoint2: {
      x: number,
      y: number,
    },
    dragPoint3: {
      x: number,
      y: number,
    },
  } | null = null

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const angleY = data.angleY || 0;// 历史数据问题，有的数据不存在angleY，所以用了一个【|| 0】给予默认值
    const drawAngelLength = Math.max(this.getData().width / 2, this.circleRadius * 2);// 0.9避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = Math.cos(angleY) * drawAngelLength
    const rotatedYAdd = Math.sin(angleY) * drawAngelLength

    const dragPoint2 = {
      x: (data.x + rotatedXAdd),
      y: (data.y - rotatedYAdd),
    }
    const dragPoint3 = {
      x: (data.x - rotatedXAdd),
      y: (data.y + rotatedYAdd),
    }

    this.beforeMatchHandleSaveData = {
      centerOffset: {
        x: x - data.x,
        y: y - data.y,
      },
      dragPoint2,
      dragPoint3,
    }

    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: data.width - this.circleRadius * 2,
      depth: this.depth + 30,
      angleY: angleY * -1,
    })) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist: 0,
      }
    }

    const dist2 = Math.hypot(x - dragPoint2.x, y - dragPoint2.y)
    // console.log('dist2', dist2)
    if (dist2 < this.circleRadius + 3) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: dist2,
      }
    }
    const dist3 = Math.hypot(x - dragPoint3.x, y - dragPoint3.y)
    if (dist3 < this.circleRadius + 3) {
      return {
        index: 2,
        type: this.type,
        id: data.id,
        dist: dist3,
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
      const { centerOffset } = this.beforeMatchHandleSaveData!
      this.changePosition({
        x: x - centerOffset.x,
        y: y - centerOffset.y,
      })
    } else if (matchHandelInfo.index === 1 || matchHandelInfo.index === 2) {
      const { dragPoint2, dragPoint3 } = this.beforeMatchHandleSaveData!
      let newDragPoint2 = { ...dragPoint2 }
      let newDragPoint3 = { ...dragPoint3 }
      if (matchHandelInfo.index === 1) {
        newDragPoint2 = { x, y }
      } else if (matchHandelInfo.index === 2) {
        newDragPoint3 = { x, y }
      }
      const center = {
        x: (newDragPoint2.x + newDragPoint3.x) / 2,
        y: (newDragPoint2.y + newDragPoint3.y) / 2,
      }
      const allDistance = Math.hypot(newDragPoint2.x - newDragPoint3.x, newDragPoint2.y - newDragPoint3.y)
      const angleY = Math.atan2(newDragPoint2.y - newDragPoint3.y, newDragPoint2.x - newDragPoint3.x)
      this.setData({
        ...this.getData(),
        width: Math.round(allDistance),
        x: Math.round(center.x),
        y: Math.round(center.y),
        angleY: angleY * -1,
      })
    }
  }

  getMineBeSnapPoints() {
    return []
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  setData(data: CurtainData) {
    // 双向去除原有的关联对象
    this.associationEntity.forEach(entity => {
      if (entity.associationEntity.includes(this)) {
        entity.remove3DCache()
      }
    })
    super.setData(data)
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow([
      {
        id: 'width',
        label: '宽度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.width,
      },
      {
        id: 'height',
        label: '高度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.height,
      },
      {
        id: 'img',
        label: '图片',
        dataType: 'img',
        value: data.img,
      },
      {
        id: 'z',
        label: '距离地面高度',
        dataType: 'number',
        min: -Infinity,
        max: Infinity,
        step: 1,
        value: data.z,
      },
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    return false
  }

  inSceneSnapLineArea(obj: EntityClass<CurtainData>, line: [Point, Point]) {
    return false
  }

  setPrepareState(x: number, y: number): void {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
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
    console.log('cacheData', JSON.stringify(cacheData))
    return this.type + JSON.stringify(cacheData)
  }

  inAreaHoverText() {
    const data = this.getData();
    return this.name + `(${Math.round(data.width).toString()}cm×${Math.round(data.height).toString()}cm)`
  }

  defaultValue(): CurtainData {
    const data: CurtainData = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      width: 200,
      height: 200,
      angleY: 0,
      img: '', // https://q0.itc.cn/q_70/images03/20250729/b9252b83f9a64720b2077345a655f144.jpeg
    }
    return new CurtainDataClass(data)
  }
}
