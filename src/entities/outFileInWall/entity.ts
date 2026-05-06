import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { OutFileInWallData } from './index.d'
import { MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// @ts-ignore
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { getMaterialById } from '@/material'
import { OutFileInWallDataClass } from './dataClass';
import { EntityClassInWall } from '@/types/entityInWall'

export class OutFileInWallEntity extends EntityClassInWall<OutFileInWallData> {
  type: string = 'outFileInWall'
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

  defaultValue(): OutFileInWallData {
    // @ts-ignore
    const findObjInfo = window.ObjFiles[0];
    const data: OutFileInWallData = {
      wallPointId: -1,
      wallId: '',
      angle: 0,
      bottom: 40,
      fileTypeId: findObjInfo.id,
      id: Date.now().toString(),
      bm: null,
      x: 0,
      y: 0,
      z: 0,
      color: '#0c7f25',
    }
    return new OutFileInWallDataClass(data)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: OutFileInWallData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const angleY = data.angle;// * -1 + Math.PI / 2
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === data.fileTypeId)
    const preImgScale = findObjInfo?.preImgScale || 1
    const { width, height } = this.img;
    ctx.save(); // 保存当前状态
    ctx.translate(screenX, screenY); // 移动原点到目标中心
    ctx.rotate(angleY); // 围绕新原点旋转
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
    data: OutFileInWallData,
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
    const { scaleX, scaleY, scaleZ, url, materialUrl, angleY, materialVec } = findObjInfo
    console.log('materialVec', materialVec)
    console.log('materialId', bm);
    const materialId = (bm === null) ? (findObjInfo.materialId || -1) : bm
    console.log('materialId', color);
    console.log('scaleX', scaleX, 'scaleY', scaleY, 'scaleZ', scaleZ)
    if (url.endsWith('.obj')) {
      const loader = new OBJLoader()
      const materLoader = new MTLLoader()

      // 将方向向量旋转90度
      const rotatedDirection = materialVec ? new THREE.Vector3(...materialVec) : new THREE.Vector3(-1, 1, 1)
      const material: THREE.Material | undefined = (() => {
        if (materialId !== -1 && materialId !== null) {
          const mater = getMaterialById(materialId);
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
      function render(object: THREE.Group) {
        object.scale.set(scaleX, scaleY, scaleZ)
        object.rotation.y = angleY * -1

        if (!materialUrl) {
          // @ts-ignore
          object.material = material
        }

        // 添加默认材质（如果模型没有材质）
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (materialId !== -1 && materialId !== null) {
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
      v.rotation.y = data.angle
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
    const rotatedXAdd = data.x + Math.cos(data.angle) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angle) * drawAngelLength

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
      // 根据x,y计算angle
      const angle = Math.atan2(y - data.y, x - data.x)
      console.log(angle)
      this.setData({
        ...this.getData(),
        angle: angle * -1,
      })
    }
  }

  getMineBeSnapPoints(): Array<OrigionSnapPoint> {
    const { x, y, angle, id } = this.getData()
    // 计算旋转后的点
    // const rotatedX = x * Math.cos(angle) - y * Math.sin(angle)
    // const rotatedY = x * Math.sin(angle) + y * Math.cos(angle)

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
