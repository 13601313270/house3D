import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { OutFileData } from './index.d'
import { EntityClass, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// @ts-ignore
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getMaterialById } from '@/material'
import { OutFileDataClass } from './dataClass';
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'

export class OutFileEntity extends EntityClass<OutFileData> {
  name: string = '外部文件'
  type: string = 'outFile'
  isPointObj: boolean = true
  color: string = '#0c7f25'
  color3D: string = '#0c7f25'
  colorOpacity: string = '#14b737a5'
  private baseDrawAngelLength = 40;
  img: HTMLImageElement = new Image()
  private circleRadius = 6

  init(): Promise<void> {
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === this.getData().fileTypeId)
    const preImg = findObjInfo?.preImg || ''
    if (findObjInfo?.name) {
      this.name = findObjInfo.name
    }

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
    // @ts-ignore
    const findObjInfo = window.ObjFiles[0];
    const data: OutFileData = {
      fileTypeId: findObjInfo.id,
      id: Date.now().toString(),
      angleY: 0,
      bm: null,
      x: 0,
      y: 0,
      z: findObjInfo.defaultZ || 0,
      color: '#0c7f25',
      canAngelZ: findObjInfo.canAngelZ,
    }
    return new OutFileDataClass(data)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: OutFileData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const previewAngleY = data.angleY;
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === data.fileTypeId)
    const preImgScale = findObjInfo?.preImgScale || 1
    const { width, height } = this.img;
    ctx.save(); // 保存当前状态
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(previewAngleY * -1); // 围绕新原点旋转
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

    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === data.fileTypeId)
    let centerCircleRadius = this.circleRadius
    if (findObjInfo) {
      if (findObjInfo.matchAreaType === 1) {
        centerCircleRadius = Math.max(findObjInfo.matchAreaNumber1, findObjInfo.matchAreaNumber2) / 20
      } else if (findObjInfo.matchAreaType === 2) {
        centerCircleRadius = findObjInfo.matchAreaNumber1 / 10
      }
    }
    centerCircleRadius = Math.max(centerCircleRadius, this.circleRadius)

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, centerCircleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    if (findObjInfo && !findObjInfo.canAngelZ) {
      return;
    }
    const drawAngelLength = Math.max(findObjInfo?.drawAngelLength || this.baseDrawAngelLength, this.circleRadius * 2)

    const drawAngelHandelAngel = data.angleY + (findObjInfo?.drawAngelAngel || 0);

    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(drawAngelHandelAngel) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(drawAngelHandelAngel) * drawAngelLength

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
    ctx.arc(screenX, screenY, drawAngelLength * zoomLevel, drawAngelHandelAngel * -1 - Math.PI / 4, drawAngelHandelAngel * -1 + Math.PI / 4);
    ctx.stroke();

    // 左侧箭头
    (() => {
      ctx.beginPath()
      const [p1X, p1Y] = ttt(drawAngelHandelAngel + 0.1 + Math.PI / 4, drawAngelLength)
      const [p2X, p2Y] = ttt(drawAngelHandelAngel + Math.PI / 4, drawAngelLength + 5)
      const [p3X, p3Y] = ttt(drawAngelHandelAngel + Math.PI / 4, drawAngelLength - 5)
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
    const [p1X, p1Y] = ttt(drawAngelHandelAngel - 0.1 - Math.PI / 4, drawAngelLength)
    const [p2X, p2Y] = ttt(drawAngelHandelAngel - Math.PI / 4, drawAngelLength + 5)
    const [p3X, p3Y] = ttt(drawAngelHandelAngel - Math.PI / 4, drawAngelLength - 5)
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
    const circleRadius = centerCircleRadius * zoomLevel + 3
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
    const { fileTypeId, bm, color } = data
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === fileTypeId)

    if (!findObjInfo) {
      console.error('未找到对应的文件类型:', fileTypeId)
      return []
    }
    const {
      scaleX,
      scaleY,
      scaleZ,
      url,
      materialUrl,
      angleY,
      materialVec,
      defaultColor,
      materialId,
    } = findObjInfo
    console.log('materialVec', materialVec)
    console.log('materialId', bm);
    const materialUseId = (bm === null) ? (materialId || -1) : bm
    console.log('materialId', color);
    console.log('scaleX', scaleX, 'scaleY', scaleY, 'scaleZ', scaleZ)
    // 将方向向量旋转90度
    const rotatedDirection = materialVec ? new THREE.Vector3(...materialVec) : new THREE.Vector3(-1, 1, 1)
    const material: THREE.Material | undefined = (() => {
      if (materialUseId !== -1 && materialUseId !== null) {
        const mater = getMaterialById(materialUseId);
        if (mater) {
          return mater.material(rotatedDirection)
        }
      }
      return new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.1
      });
    })();
    if (url.endsWith('.obj')) {
      const loader = new OBJLoader()
      const materLoader = new MTLLoader()
      function render(object: THREE.Group) {
        object.scale.set(scaleX, scaleY, scaleZ)
        object.rotation.y = angleY

        if (!materialUrl) {
          // @ts-ignore
          object.material = material
        }

        // 添加默认材质（如果模型没有材质）
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (materialUseId !== -1 && materialUseId !== null) {
              child.material = material
            } else {
              if (!materialUrl) {
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
    } else if (url.endsWith('.glb')) {
      const loader = new GLTFLoader()
      loader.load(url, (gltf: any) => {
        gltf.scene.rotation.y = angleY
        gltf.scene.scale.set(scaleX, scaleY, scaleZ)
        if (defaultColor || materialId) {
          // @ts-ignore
          gltf.scene.material = material
          gltf.scene.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
              if (materialUseId !== -1 && materialUseId !== null) {
                child.material = material
              } else {
                child.material = material
              }
            }
          })
          gltf.scene.material = material
        }
        group.add(gltf.scene)
      }, (progress: any) => {
        // 加载进度
        const percent = (progress.loaded / progress.total * 100).toFixed(2)
        console.log('加载进度:', percent + '%')
      }, (error: any) => {
        console.error('OBJ文件加载失败:', error)
      })
    }

    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null {
    const data = this.getData();

    const { fileTypeId } = data
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === fileTypeId)
    if (!findObjInfo) {
      console.error('未找到对应的文件类型:', fileTypeId)
      return null
    }

    const {
      matchAreaType,
      matchAreaNumber1,
      matchAreaNumber2,
      matchAreaDepth,
      matchAreaOffsetX,
      matchAreaOffsetY
    } = findObjInfo

    let width = 0;
    const height = Math.max(matchAreaDepth || 0, 30);
    let depth = 0;
    let offsetX = 0;
    let offsetZ = 0;

    if (matchAreaType === 1) {
      // 矩形区域
      width = Math.max(matchAreaNumber1 || 0, 30);
      depth = Math.max(matchAreaNumber2 || 0, 30);
      offsetX = matchAreaOffsetX || 0;
      offsetZ = matchAreaOffsetY || 0;
    } else if (matchAreaType === 2) {
      // 圆形区域，使用外接正方形
      const radius = matchAreaNumber1 || 0;
      width = radius * 2;
      depth = radius * 2;
      offsetX = matchAreaOffsetX || 0;
      offsetZ = matchAreaOffsetY || 0;
    }

    // 计算偏移位置（考虑旋转）
    const finalOffsetX = offsetX * Math.cos(data.angleY) + offsetZ * Math.sin(data.angleY);
    const finalOffsetZ = -offsetX * Math.sin(data.angleY) + offsetZ * Math.cos(data.angleY);

    return [
      new THREE.Vector3(width, height, depth),
      new THREE.Vector3(finalOffsetX, height / 2, finalOffsetZ),
      new THREE.Vector3(0, 0, 0)
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

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    const { fileTypeId } = data
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === fileTypeId)

    if (findObjInfo) {
      const { matchAreaType, matchAreaNumber1, matchAreaNumber2, matchAreaOffsetX, matchAreaOffsetY } = findObjInfo
      if (matchAreaType === 1) {
        if (isPointInRotatedRect(x, y, {
          x: data.x + matchAreaOffsetX * Math.cos(data.angleY) + matchAreaOffsetY * Math.sin(data.angleY),
          y: data.y - matchAreaOffsetX * Math.sin(data.angleY) + matchAreaOffsetY * Math.cos(data.angleY),
          width: Math.max(matchAreaNumber1, 30),
          depth: Math.max(matchAreaNumber2, 30),
          angleY: data.angleY * -1,
        })) {
          return new MatchRectArea({
            x: data.x + matchAreaOffsetX * Math.cos(data.angleY) + matchAreaOffsetY * Math.sin(data.angleY),
            y: data.y - matchAreaOffsetX * Math.sin(data.angleY) + matchAreaOffsetY * Math.cos(data.angleY),
            width: Math.max(matchAreaNumber1, 30),
            depth: Math.max(matchAreaNumber2, 30),
            angleY: data.angleY,
          })
        }
      } else if (matchAreaType === 2) {
        if (dist < matchAreaNumber1) {
          return new MatchCircleArea({
            x: data.x,
            y: data.y,
            r: matchAreaNumber1
          })
        }
      }
      return null
    } else {
      if (dist < this.circleRadius + 10) {
        return new MatchCircleArea({ x: data.x, y: data.y, r: this.circleRadius })
      }
      return null;
    }
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)

    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === data.fileTypeId)
    let centerCircleRadius = this.circleRadius
    if (findObjInfo) {
      if (findObjInfo.matchAreaType === 1) {
        centerCircleRadius = Math.max(findObjInfo.matchAreaNumber1, findObjInfo.matchAreaNumber2) / 10
      } else if (findObjInfo.matchAreaType === 2) {
        centerCircleRadius = findObjInfo.matchAreaNumber1 / 10
      }
    }
    centerCircleRadius = Math.max(centerCircleRadius, this.circleRadius)
    // console.log('dist', dist)
    if (dist < centerCircleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist: dist,
      }
    }
    const drawAngelHandelAngel = data.angleY + (findObjInfo?.drawAngelAngel || 0);
    const drawAngelLength = Math.max(findObjInfo?.drawAngelLength || this.baseDrawAngelLength, centerCircleRadius * 2)
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(drawAngelHandelAngel) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(drawAngelHandelAngel) * drawAngelLength

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
    // console.log('dist2', dist2)
    if (dist2 < centerCircleRadius + 3) {
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
      const findObjInfo = this.world.ObjFileTypes.find(item => item.id === data.fileTypeId)
      console.log(angleY)
      this.setData({
        ...this.getData(),
        angleY: angleY * -1 - (findObjInfo?.drawAngelAngel || 0),
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
        label: '距离地面',
        dataType: 'number',
        min: -100,
        max: 200,
        step: 1,
        value: data.z,
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color,
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
