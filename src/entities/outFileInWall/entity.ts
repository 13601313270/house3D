import { HandelInfo, ObjData, Point } from '@/types/map2d'
import * as THREE from 'three'
import { OutFileInWallData } from './index.d'
import { EntityClass, MatchSnapPoint, OrigionSnapPoint } from '@/types/entity'
import { editItem } from '..'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// @ts-ignore
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getMaterialById } from '@/material'
import { OutFileInWallDataClass } from './dataClass';
import { EntityClassInWall } from '@/types/entityInWall'
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'

export class OutFileInWallEntity extends EntityClassInWall<OutFileInWallData> {
  type: string = 'outFileInWall'
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
      isOuter: false,
      canAngelZ: findObjInfo.canAngelZ,
    }
    return new OutFileInWallDataClass(data)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: OutFileInWallData, panOffset: Point, zoomLevel: number): void {
    const { x, y, isOuter, angle, wallId, fileTypeId } = data
    const screenX = x * zoomLevel + panOffset.x
    const screenY = y * zoomLevel + panOffset.y
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === fileTypeId)
    const preImgScale = findObjInfo?.preImgScale || 1
    const { width, height } = this.img;
    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    // 沿着angleY角度移动10像素的偏移量
    const offsetX = Math.cos(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness * zoomLevel;
    const offsetY = Math.sin(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness * zoomLevel;
    // console.log('=======', angleY, offsetX, offsetY)
    ctx.save(); // 保存当前状态
    ctx.translate(screenX + offsetX, screenY + offsetY); // 移动原点到目标中心
    ctx.rotate(isOuter ? angle + Math.PI : angle); // 围绕新原点旋转
    ctx.drawImage(
      this.img,
      preImgScale / -2 * width * zoomLevel,
      preImgScale / -2 * height * zoomLevel,
      preImgScale * width * zoomLevel,
      preImgScale * height * zoomLevel
    );
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
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  create3DMesh(scene: THREE.Scene): THREE.Group[] {
    const data = this.getData();
    const group = new THREE.Group()
    const { fileTypeId, bm, color, wallId, isOuter } = data
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === fileTypeId)

    if (!findObjInfo) {
      console.error('未找到对应的文件类型:', fileTypeId)
      return []
    }
    if (!this.world.allFileMapObjects.wall) {
      this.world.allFileMapObjects.wall = []
    }
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    const { scaleX, scaleY, scaleZ, url, materialUrl, angleY, materialVec, defaultColor, materialId } = findObjInfo
    console.log('materialVec', materialVec)
    console.log('materialId', bm);
    const materialUseId = (bm === null) ? (materialId || -1) : bm
    console.log('materialId', color);
    console.log('scaleX', scaleX, 'scaleY', scaleY, 'scaleZ', scaleZ)
    const offsetX = Math.cos(angleY + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness;
    const offsetY = Math.sin(angleY + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness;
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
    if (url.endsWith('.obj')) {
      const loader = new OBJLoader()
      const materLoader = new MTLLoader()

      function render(object: THREE.Group) {
        object.scale.set(scaleX, scaleY, scaleZ)
        object.rotation.y = angleY * -1 + (isOuter ? Math.PI : 0)
        object.position.set(offsetX, 0, offsetY)

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
    } else if (url.endsWith('.glb')) {
      const loader = new GLTFLoader()
      loader.load(url, (gltf: any) => {
        gltf.scene.scale.set(scaleX, scaleY, scaleZ)
        console.log('offsetX', offsetX, 'offsetY', offsetY)
        gltf.scene.rotation.y = angleY * -1 + (isOuter ? Math.PI : 0)
        gltf.scene.position.set(offsetX, 0, offsetY)
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
      wallId: undefined,
      wallPointId: undefined,
      angle: undefined,
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
      v.rotation.y = data.angle * -1
    })
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    const { fileTypeId, angle, isOuter, wallId } = data
    const findObjInfo = this.world.ObjFileTypes.find(item => item.id === fileTypeId)
    if (findObjInfo) {
      const { matchAreaType, matchAreaNumber1, matchAreaNumber2 } = findObjInfo
      if (matchAreaType === 1) {
        if (!this.world.allFileMapObjects.wall) {
          this.world.allFileMapObjects.wall = []
        }
        const wall = this.world.allFileMapObjects.wall.find((entity) => {
          return entity.getData().id === wallId;
        })
        const wallThickness = wall ? wall.getData().thickness : 10;
        const offsetX = Math.cos(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness;
        const offsetY = Math.sin(angle + (isOuter ? Math.PI / -2 : Math.PI / 2)) * wallThickness;
        const dataX = data.x + offsetX;
        const dataY = data.y + offsetY;
        if (isPointInRotatedRect(x, y, {
          x: dataX,
          y: dataY,
          width: Math.max(matchAreaNumber1, 30),
          depth: Math.max(matchAreaNumber2 + wallThickness * 4, 30),
          angleY: data.angle,
        })) {
          return new MatchRectArea({
            x: dataX,
            y: dataY,
            width: Math.max(matchAreaNumber1, 10),
            depth: Math.max(matchAreaNumber2 + wallThickness * 4, 30),
            angleY: data.angle * -1,
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
      return null;
    } else {
      if (dist < this.circleRadius + 3) {
        return new MatchCircleArea({ x: data.x, y: data.y, r: this.circleRadius })
      }
      return null;
    }
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
        dist: dist,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo) {
    if (matchHandelInfo.index === 0) {
      this.changePosition({ x, y })
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
      },
      {
        id: 'isOuter',
        label: '是否挂在外墙',
        dataType: 'boolean',
        value: data.isOuter,
      },
    ]
    editShow(configList, (val) => {
      this.setData({
        ...this.getData(),
        ...val,
      })
    })
  }

  inSceneSnapLineArea(obj: EntityClass<ObjData>, line: [Point, Point], point: Point) {
    if (obj.type === 'wall') {
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

      const allLineKey = obj.getMineBeSnapLines().map(v => [v[0].x, v[0].y, v[1].x, v[1].y].join(','))
      const lineKey = [p1.x, p1.y, p2.x, p2.y].join(',')
      const index = allLineKey.indexOf(lineKey)
      const data = this.getData();
      const objData = obj.getData()
      this.setData({
        ...data,
        x: point.x,
        y: point.y,
        angle: nearestAngle,
        wallId: objData.id,
        wallPointId: index,
      })
      return true;
    }
    return false;
  }

  notInSceneSnapLineArea() {
    const data = this.getData();
    if (data.wallId) {
      const data = this.getData();
      this.setData({
        ...data,
        wallId: undefined,
        wallPointId: -1,
      })
      return true;
    }
  }
}
