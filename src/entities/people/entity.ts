import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { PeopleData } from './index.d'
import { EntityClass, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// @ts-ignore
import kamera from './kamera.png'
import { PeopleDataClass } from './dataClass'
import { MatchCircleArea } from '@/utils/matchArea'

const img = new Image()
img.src = 'people.png'

export class PeopleEntity extends EntityClass<PeopleData> {
  name: string = '人物'
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
      bone: [],
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

    const drawAngelLength = this.drawAngelLength * data.height / 170

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
    console.log('create3DMesh', 1)

    const data = this.getData();
    const loader = new FBXLoader()
    const group = new THREE.Group()
    const { color, tip } = data
    loader.load('./ManClean.fbx', (fbxModel: any) => {
      fbxModel.rotateX(Math.PI);
      fbxModel.rotateY(Math.PI)
      fbxModel.rotateZ(Math.PI);
      fbxModel.scale.set(0.0261, 0.0261, 0.0261)
      const boneListConfig = data.bone || [];
      fbxModel.traverse((child: any) => {
        if (child.isBone) {
          console.log(`🦴 发现骨骼: ${child.name}`);
          const findProp = boneListConfig.find((item) => item.name === child.name)
          if (findProp) {
            child.rotation.set(findProp.value.x, findProp.value.y, findProp.value.z)
          }
          console.log(`🦴 发现骨骼-1:${child.name}: ${child.rotation.x}, ${child.rotation.y}, ${child.rotation.z}`);
        }
      });
      // 设置人物颜色
      fbxModel.traverse((child: any) => {
        if (child.isMesh) {
          child.material.color.set(color)
        }
      })
      group.add(fbxModel)
      if (tip) {
        // // 创建文字标签
        // const canvas = document.createElement('canvas');
        // const context = canvas.getContext('2d')!;
        // const fontSize = 64;
        // context.font = `bold ${fontSize}px Arial`;
        // const textWidth = context.measureText(tip).width;
        // canvas.width = textWidth + 40;
        // canvas.height = fontSize + 40;

        // // 重新设置字体（因为canvas resize后会重置）
        // context.font = `bold ${fontSize}px Arial`;
        // context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        // context.fillRect(0, 0, canvas.width, canvas.height);
        // context.strokeStyle = '#e67e22';
        // context.lineWidth = 4;
        // context.strokeRect(0, 0, canvas.width, canvas.height);
        // context.fillStyle = '#333';
        // context.textAlign = 'center';
        // context.textBaseline = 'middle';
        // context.fillText(tip, canvas.width / 2, canvas.height / 2);

        // const texture = new THREE.CanvasTexture(canvas);
        // const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        // const sprite = new THREE.Sprite(spriteMaterial);
        // sprite.scale.set(canvas.width / 50, canvas.height / 50, 1);
        // sprite.position.set(0, 2.5, 0); // 在模型上方
        // group.add(sprite);
      }
    }, (progress: any) => {
      const percent = (progress.loaded / progress.total * 100).toFixed(2)
      console.log('加载进度:', percent + '%')
    }, (error: any) => {
      console.error('FBX文件加载失败:', error)
    })
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3] {
    return [
      new THREE.Vector3(2, 5, 1),
      new THREE.Vector3(0, 2.5, 0)
    ]
  }

  change3DMeshState(): void {
    console.log('create3DMesh', 2, this.meshList)
    const data = this.getData();
    const singleHeight = 0.213
    const { height, angle, tip } = data
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
      v.scale.set(singleHeight * height, singleHeight * height, singleHeight * height)
      v.rotation.set(0, angle * -1, 0)
    })
    if (this.meshList?.[0]?.children[0] && data.bone && data.bone?.length > 0) {
      const boneListConfig = data.bone
      this.meshList?.[0]?.children[0].traverse((child: any) => {
        if (child.isBone) {
          const findProp = boneListConfig.find((item) => item.name === child.name)
          if (findProp) {
            console.log(`🦴 发现骨骼-1: ${child.name}`, findProp.value);
            child.rotation.set(findProp.value.x, findProp.value.y, findProp.value.z)
            child.position.set(findProp.value.px, findProp.value.py, findProp.value.pz)
          }
        }
      })
    }
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
      bone: undefined,
    }
    return this.type + JSON.stringify(cacheData)
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    // console.log('dist', dist)
    if (dist < data.height * 0.3 + 10) {
      return new MatchCircleArea({ x: data.x, y: data.y, r: data.height * 0.3 + 10 })
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
        min: 1,
        max: 500,
        step: 15,
        value: data.height,
      },
      {
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -100,
        max: 200,
        step: 1,
        value: data.z,
      },
      {
        id: 'bone',
        label: '骨骼',
        dataType: 'hidden',
        value: data.bone || [],
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color || '#fff',
      },
      {
        id: 'tips',
        label: '提示信息',
        dataType: 'string',
        value: data.tip || '',
      }
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }
}

export function changePeopleBone(gltfScene: THREE.Group, boneListConfig: Array<{
  name: string
  value: {
    x: number
    y: number
    z: number
  }
}>): void {
  gltfScene.traverse((child: any) => {
    if (child.isBone) {
      console.log(`🦴 发现骨骼: ${child.name}`)
      const findProp = boneListConfig.find((item) => item.name === child.name)
      if (findProp) {
        child.rotation.set(findProp.value.x, findProp.value.y, findProp.value.z)
      }
    }
  })
}