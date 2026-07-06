import * as THREE from 'three'
import { Point } from '../types'
import { DoorEntity } from '@/entities/door/entity'
import { drawPoint } from './drawPoint'
import { calculateAngle } from './calculateAngle'
import { allFileKeys, EntityConstructor, fileData, fileDataKeyToClass } from '@/entities/index'
import { PointEntityClass } from '@/types/pointEntity'
import { BaseObjDataClass } from '@/entities/objData'
import { ImportFileType, ImportImgType, ObjOutputFileType } from '@/entities/allObjs';
import { BaseEntityClass } from '@/types/baseEntity'
import { BaseObjData } from '@/types/map2d'
import { CameraEntity } from '@/entities/camera/entity'

export const canvasHeight = 600
export const snapThreshold = 20
type WorldChangeType = 'add' | 'remove' | 'change'

export interface EnvironmentConfig {
  skyType: number
  ambientLightIntensity?: number
  showGround?: boolean
}

export class World {
  allFileMapObjects: {
    [key in string]?: BaseEntityClass<BaseObjData>[]
  } = {}

  // 锁定状态的对象列表
  lockedObjList: BaseEntityClass<BaseObjData>[] = []

  ObjFileTypes: ObjOutputFileType[] = []

  allImportFiles: ImportFileType[] = []

  allImportImgs: ImportImgType[] = []

  activeCameraIndex: number = -1

  environmentConfig: EnvironmentConfig = { skyType: 1, ambientLightIntensity: 1, showGround: true }

  ambientLight: THREE.AmbientLight | null = null

  directionalLight: THREE.DirectionalLight | null = null

  groundMesh: THREE.Mesh | null = null

  scene: THREE.Scene

  isShowBoundingBox: boolean = false

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f0f0)

    const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
    gridHelper.layers.set(2)
    this.scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(100)
    axesHelper.layers.set(2)
    this.scene.add(axesHelper)

    this.setEnvironMent()
  }

  setEnvironMent(config?: EnvironmentConfig) {
    if (config) {
      this.environmentConfig = config
    }
    const intensity = this.environmentConfig.ambientLightIntensity !== undefined ? this.environmentConfig.ambientLightIntensity : 1.5
    console.log('intensity', intensity, this.environmentConfig.ambientLightIntensity);

    if (this.ambientLight) {
      this.ambientLight.intensity = intensity === 0 ? 0.1 : intensity
    } else {
      this.ambientLight = new THREE.AmbientLight(0xffffff, intensity)
      this.scene.add(this.ambientLight)
    }

    // if (!this.directionalLight) {
    //   this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    //   this.directionalLight.position.set(100, 200, 100)
    //   this.scene.add(this.directionalLight)
    // }

    const skyType = this.environmentConfig.skyType || 1;
    const skyImgMap: Record<number, string> = {
      1: '/skyImg/sky.jpg',
      2: '/skyImg/sky2.jpg',
      3: '/skyImg/sky3.jpg',
      4: '/skyImg/sky4.jpg',
      5: '/skyImg/sky5.jpg',
      6: '/skyImg/sky6.jpg',
      7: '/skyImg/sky7.jpg',
    };
    const path = skyImgMap[skyType] || '/skyImg/sky.jpg';
    // === 加载 JPG 全景 ===
    const loaderSky = new THREE.TextureLoader();
    loaderSky.load(path, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.background = texture;
      this.scene.environment = texture; // 可选：简单环境光
    });

    // 添加地面
    const showGround = this.environmentConfig.showGround ?? true

    if (this.groundMesh) {
      this.groundMesh.visible = showGround
      return
    }

    if (!showGround) return

    const loaderGround = new THREE.TextureLoader();
    loaderGround.load('grand.jpg', (texture) => {
      // 增加一个地面平面
      const groundGeometry = new THREE.PlaneGeometry(20000, 20000, 1, 1)
      // 设置纹理重复两次
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(12, 12);

      const groundMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.2,
      })
      this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
      this.groundMesh.rotation.x = -Math.PI / 2
      this.groundMesh.position.y = -10
      this.scene.add(this.groundMesh)
    });
  }

  draw2DWorld(
    canvasBgRef: HTMLCanvasElement | null,
    panOffset: Point = { x: 0, y: 0 },
    canvasWidth: number = 800,
    canvasHeight: number = 600,
    zoomLevel: number = 1,
  ) {
    if (!canvasBgRef) return
    const ctx = canvasBgRef.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    // 绘制墙体
    if (!this.allFileMapObjects.wall) {
      this.allFileMapObjects.wall = []
    }

    const fileData = this.getAllFileObjects()
    const allObj: PointEntityClass<any>[] = [];
    allFileKeys.forEach((key) => {
      if (fileData[key]) {
        fileData[key].forEach((item, index) => {
          // @ts-ignore
          const itemApi: DoorEntity = this.allFileMapObjects[key][index];
          if (itemApi) {
            allObj.push(itemApi)
          }
        })
      }
    })
    allObj.sort((a, b) => {
      const aData = a.getData()
      const bData = b.getData()
      const aZ = ((aData.z || 0) + (a.boundingBoxData ? a.boundingBoxData[0].y : 0))
      const bZ = ((bData.z || 0) + (b.boundingBoxData ? b.boundingBoxData[0].y : 0))
      return aZ - bZ
    }).forEach((item) => {
      item.draw2DPreview(ctx, panOffset, zoomLevel)
    })

    // 绘制所有ObjFile的中心点
    // this.allObjFiles.forEach((item) => {
    //   drawPoint(ctx, item.x * zoomLevel + panOffset.x, item.y * zoomLevel + panOffset.y, '#42b983')
    // })

    // 绘制轴
    drawAxes(ctx, panOffset, zoomLevel, canvasWidth, canvasHeight)
  }

  // 绘制操作句柄
  draw2DWorldActionHandle(
    canvasActionRef: HTMLCanvasElement,
    fileData: fileData,
    panOffset: Point = { x: 0, y: 0 },
    zoomLevel: number = 1,
  ) {
    const ctxAction = canvasActionRef.getContext('2d')!
    ctxAction.clearRect(0, 0, canvasActionRef.width, canvasActionRef.height)
    allFileKeys.forEach((key) => {
      if (fileData[key]) {
        fileData[key].forEach((item, index) => {
          // @ts-ignore
          const itemApi: DoorEntity = this.allFileMapObjects[key][index];
          if (itemApi) {
            itemApi.draw2D(ctxAction, panOffset, zoomLevel)
          }
        })
      }
    })
  }

  draw3D() {
    allFileKeys.forEach((key) => {
      if (this.allFileMapObjects[key]) {
        (this.allFileMapObjects[key] as BaseEntityClass<any>[]).forEach((item) => {
          item.reCreate3DMeshIfNeed()
          item.change3DMeshState()
          if (item instanceof PointEntityClass && !(item instanceof CameraEntity)) {
            setTimeout(() => {
              const boundingBox = item.createBoundingBox();
              if (boundingBox && this.isShowBoundingBox) {
                const data = item.getData();
                // console.log('this.isShowBoundingBox', this.isShowBoundingBox);
                // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
                const [boxVector3, offsetVector3, rotateVector3] = boundingBox;
                item.boundingBoxData = [boxVector3, offsetVector3, rotateVector3]
                item.boundingBox.position.set(data.x, data.z, data.y)
                item.boundingBox.children[0].rotation.set(rotateVector3.x, rotateVector3.y, rotateVector3.z)
                item.boundingBox.children[0].scale.set(boxVector3.x, boxVector3.y, boxVector3.z)
                item.boundingBox.children[0].position.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)
                item.boundingBox.visible = this.isShowBoundingBox
                if (item.spriteGroup) {
                  item.spriteGroup.position.set(data.x, data.z, data.y)
                  item.spriteGroup.children[0].position.set(0, boxVector3.y / 2 + offsetVector3.y + 12, 0)
                }
              } else {
                item.boundingBox.visible = false
              }
            })
          }
        });
      }
    });
  }

  getAllFileObjects(): fileData {
    const returnData: fileData = {};
    allFileKeys.forEach((key) => {
      returnData[key] = []
      if (this.allFileMapObjects[key]) {
        (this.allFileMapObjects[key] as PointEntityClass<any>[]).forEach((item) => {
          // @ts-ignore
          returnData[key].push(item.getData())
        })
      }
    })
    return returnData
  }

  getObjects(type: string) {
    const returnData: BaseObjDataClass<any>[] = [];
    if (!this.allFileMapObjects[type]) {
      this.allFileMapObjects[type] = []
    }
    this.allFileMapObjects[type].forEach((item) => {
      returnData.push(item.getData())
    })
    return returnData
  }

  async add(type: string, data: BaseObjDataClass<any>[]): Promise<BaseEntityClass<any>[]> {
    const EntityClassItem: EntityConstructor = fileDataKeyToClass[type] as any;
    if (!this.allFileMapObjects[type]) {
      this.allFileMapObjects[type] = []
    }
    const apiList = [];
    for (let i = 0; i < data.length; i++) {
      const api: BaseEntityClass<any> = new EntityClassItem(this, data[i]);
      await api.init()
      apiList.push(api);
      this.allFileMapObjects[type].push(api)
      this.worldAddBindList.forEach(callback => callback(api))
      if (api.getData().isLocked) {
        this.lockedObjList.push(api)
      }
    }
    this._callAllOnChangeCallback('add', apiList)
    return apiList;
  }

  splice(type: string, index: number, count: number = 1) {
    if (this.allFileMapObjects[type]) {
      const backup = this.allFileMapObjects[type][index];
      this.allFileMapObjects[type][index].beforeRemove()
      this.allFileMapObjects[type].splice(index, count)
      if (backup.getData().isLocked) {
        const index = this.lockedObjList.indexOf(backup)
        if (index !== -1) {
          this.lockedObjList.splice(index, 1)
        }
      }
      this._callAllOnChangeCallback('remove', [backup])
    }
  }

  clearAll() {
    const willRemoveList: BaseEntityClass<any>[] = [];
    allFileKeys.forEach((type) => {
      if (this.allFileMapObjects[type]) {
        (this.allFileMapObjects[type] as BaseEntityClass<any>[]).forEach((item) => {
          willRemoveList.push(item);
        });
      }
    })
    allFileKeys.forEach((type) => {
      if (this.allFileMapObjects[type]) {
        (this.allFileMapObjects[type] as BaseEntityClass<any>[]).forEach((item) => {
          if (item.getData().isLocked) {
            const index = this.lockedObjList.indexOf(item)
            if (index !== -1) {
              this.lockedObjList.splice(index, 1)
            }
          }
          item.beforeRemove()
        });
        this.allFileMapObjects[type] = []
      }
    })
    this._callAllOnChangeCallback('remove', willRemoveList);
  }

  // 世界变化
  worldChangeBindList: ((type: WorldChangeType, obj: BaseEntityClass<BaseObjData>[]) => void)[] = [];
  onWorldChange(callback: (type: WorldChangeType, obj: BaseEntityClass<BaseObjData>[]) => void) {
    this.worldChangeBindList.push(callback)
  }

  private _callAllOnChangeCallback(type: WorldChangeType, obj: BaseEntityClass<BaseObjData>[]) {
    this.worldChangeBindList.forEach(callback => callback(type, obj))
  }

  // 世界添加对象
  worldAddBindList: ((obj: BaseEntityClass<BaseObjData>) => void)[] = [];
  onWorldAddObj(callback: (obj: BaseEntityClass<BaseObjData>) => void) {
    this.worldAddBindList.push(callback)
  }

  // 世界对象修改
  worldObjChangeDataBindList: ((obj: BaseEntityClass<BaseObjData>) => void)[] = [];
  onWorldObjChangeData(callback: (obj: BaseEntityClass<BaseObjData>) => void) {
    this.worldObjChangeDataBindList.push(callback)
  }

  public _callObjDataChange(obj: BaseEntityClass<BaseObjData>) {
    this.worldObjChangeDataBindList.forEach(callback => callback(obj))
    if (obj.getData().isLocked) {
      if (!this.lockedObjList.includes(obj)) {
        this.lockedObjList.push(obj)
      }
    } else {
      const index = this.lockedObjList.indexOf(obj)
      if (index !== -1) {
        this.lockedObjList.splice(index, 1)
      }
    }
    this._callAllOnChangeCallback('change', [obj])
  }

  // 世界对象删除
  worldObjRemoveBindList: ((obj: BaseEntityClass<BaseObjData>) => void)[] = [];
  onWorldObjRemove(callback: (obj: BaseEntityClass<BaseObjData>) => void) {
    this.worldObjRemoveBindList.push(callback)
  }
}

const drawAxes = (
  ctx: CanvasRenderingContext2D,
  panOffset: Point,
  zoomLevel: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  const axisColor = '#333'
  const axisLineWidth = 2
  const tickSize = 5
  const labelPadding = 15
  const scale = 100

  const originX = panOffset.x
  const originY = panOffset.y

  ctx.strokeStyle = axisColor
  ctx.lineWidth = axisLineWidth
  ctx.fillStyle = axisColor
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 绘制x轴
  ctx.beginPath()
  ctx.moveTo(0, originY)
  ctx.lineTo(canvasWidth, originY)
  ctx.stroke()

  // 绘制x轴箭头
  const arrowSize = 8
  ctx.beginPath()
  ctx.moveTo(canvasWidth, originY)
  ctx.lineTo(canvasWidth - arrowSize, originY - arrowSize / 2)
  ctx.lineTo(canvasWidth - arrowSize, originY + arrowSize / 2)
  ctx.closePath()
  ctx.fill()

  // x轴刻度和标签
  const startX = Math.floor((0 - panOffset.x) / scale) * scale
  const endX = Math.ceil((canvasWidth - panOffset.x) / scale) * scale

  for (let x = startX; x <= endX; x += scale) {
    const screenX = x * zoomLevel + panOffset.x
    if (screenX >= 0 && screenX <= canvasWidth) {
      ctx.beginPath()
      ctx.moveTo(screenX, originY - tickSize)
      ctx.lineTo(screenX, originY + tickSize)
      ctx.stroke()

      const label = x !== 0 ? `${x}px` : 'O'
      ctx.fillStyle = axisColor
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(label, screenX, originY + labelPadding)
    }
  }

  // 绘制y轴
  ctx.strokeStyle = axisColor
  ctx.lineWidth = axisLineWidth
  ctx.fillStyle = axisColor
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX, canvasHeight)
  ctx.stroke()

  // 绘制y轴箭头
  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX - arrowSize / 2, arrowSize)
  ctx.lineTo(originX + arrowSize / 2, arrowSize)
  ctx.closePath()
  ctx.fill()

  // y轴刻度和标签
  const startY = Math.floor((0 - panOffset.y) / scale) * scale
  const endY = Math.ceil((canvasHeight - panOffset.y) / scale) * scale

  for (let y = startY; y <= endY; y += scale) {
    const screenY = y * zoomLevel + panOffset.y
    if (screenY >= 0 && screenY <= canvasHeight) {
      ctx.beginPath()
      ctx.moveTo(originX - tickSize, screenY)
      ctx.lineTo(originX + tickSize, screenY)
      ctx.stroke()

      const label = y !== 0 ? `${y}px` : 'O'
      ctx.fillStyle = axisColor
      ctx.font = '10px Arial'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, originX - labelPadding, screenY)
    }
  }

  // 绘制原点标签
  ctx.fillStyle = axisColor
  ctx.font = '10px Arial'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText('O', originX - labelPadding, originY + labelPadding)
}
