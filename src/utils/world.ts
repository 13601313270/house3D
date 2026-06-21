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

export const canvasHeight = 600
export const snapThreshold = 20
type WorldChangeType = 'add' | 'remove' | 'change'

export interface EnvironmentConfig {
  skyType: number
}

export class World {
  allFileMapObjects: {
    [key in string]?: BaseEntityClass<BaseObjData>[]
  } = {}

  // 锁定状态的对象列表
  lockedObjList: BaseEntityClass<BaseObjData>[] = []

  // private allObjFiles: {
  //   id: string
  //   url: string
  //   scale: number,
  //   x: number,
  //   y: number,
  //   z: number,
  // }[] = []

  ObjFileTypes: ObjOutputFileType[] = []

  allImportFiles: ImportFileType[] = []

  allImportImgs: ImportImgType[] = []

  activeCameraIndex: number = -1

  environmentConfig: EnvironmentConfig = { skyType: 1 }

  scene: THREE.Scene

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f0f0)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 200, 100)
    this.scene.add(directionalLight)

    const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
    gridHelper.layers.set(2)
    this.scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(100)
    axesHelper.layers.set(2)
    this.scene.add(axesHelper)

    this.setEnvironMent()

    const loader2 = new THREE.TextureLoader();
    loader2.load('grand.jpg', (texture) => {
      // 增加一个地面平面
      const groundGeometry = new THREE.PlaneGeometry(20000, 20000, 1, 1)
      // 设置纹理重复两次
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(12, 12);

      const groundMaterial = new THREE.MeshBasicMaterial({
        map: texture,
      })
      const ground = new THREE.Mesh(groundGeometry, groundMaterial)
      ground.rotation.x = -Math.PI / 2
      ground.position.y = -10
      this.scene.add(ground)
    });
  }

  setEnvironMent(config?: EnvironmentConfig) {
    if (config) {
      this.environmentConfig = config
    }
    const skyType = this.environmentConfig.skyType || 1;
    const skyImgMap: Record<number, string> = {
      1: '/skyImg/sky.jpg',
      2: '/skyImg/sky2.jpg',
      3: '/skyImg/sky3.jpg',
      4: '/skyImg/sky4.jpg',
      5: '/skyImg/sky5.jpg',
    };
    const path = skyImgMap[skyType] || '/skyImg/sky.jpg';
    // === 加载 JPG 全景 ===
    const loader = new THREE.TextureLoader();
    loader.load(path, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.background = texture;
      this.scene.environment = texture; // 可选：简单环境光
    });
  }

  drawTempPointInsertData(
    canvasBgRef: HTMLCanvasElement | null,
    tempWallPoints: Point[],
    hoverPoint: Point | null,
    panOffset: Point = { x: 0, y: 0 },
    zoomLevel: number = 1,
  ) {
    if (!canvasBgRef) return
    const ctx = canvasBgRef.getContext('2d')
    if (!ctx) return
    if (tempWallPoints.length > 0) {
      ctx.strokeStyle = '#42b983'
      ctx.lineWidth = 10
      ctx.beginPath()
      ctx.moveTo(tempWallPoints[0].x * zoomLevel + panOffset.x, tempWallPoints[0].y * zoomLevel + panOffset.y)
      for (let i = 1; i < tempWallPoints.length; i++) {
        ctx.lineTo(tempWallPoints[i].x * zoomLevel + panOffset.x, tempWallPoints[i].y * zoomLevel + panOffset.y)
      }
      if (hoverPoint) {
        ctx.lineTo(hoverPoint.x * zoomLevel + panOffset.x, hoverPoint.y * zoomLevel + panOffset.y)
      }
      ctx.stroke()
      ctx.fillStyle = '#b94242'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      tempWallPoints.forEach((point, index) => {
        const screenX = point.x * zoomLevel + panOffset.x
        const screenY = point.y * zoomLevel + panOffset.y
        drawPoint(ctx, screenX, screenY, '#b94242')
        if (index > 0) {
          const prev = tempWallPoints[index - 1]
          const prevScreenX = prev.x * zoomLevel + panOffset.x
          const prevScreenY = prev.y * zoomLevel + panOffset.y
          const dist = Math.round(Math.hypot(point.x - prev.x, point.y - prev.y))
          const midX = (screenX + prevScreenX) / 2
          const midY = (screenY + prevScreenY) / 2
          ctx.strokeText(`${dist}cm`, midX, midY)
          ctx.fillText(`${dist}cm`, midX, midY)

          // 绘制角度标记
          if (index > 1) {
            const prev2 = tempWallPoints[index - 2]
            const prev2ScreenX = prev2.x * zoomLevel + panOffset.x
            const prev2ScreenY = prev2.y * zoomLevel + panOffset.y
            const angleResult = calculateAngle(
              { x: prev2ScreenX, y: prev2ScreenY },
              { x: prevScreenX, y: prevScreenY },
              { x: screenX, y: screenY }
            )
            if (angleResult !== null) {
              const { angle } = angleResult
              const angleText = `${Math.round(angle)}°`
              // 计算角度文本位置：在夹角内侧
              // 如果夹角太小（< 30度），显示在外侧；否则显示在内侧
              const offset = angle < 30 ? 15 : -15
              const angleX = prevScreenX - 10
              const angleY = prevScreenY + offset
              ctx.strokeText(angleText, angleX, angleY)
              ctx.fillText(angleText, angleX, angleY)
            }
          }
        }
      })

      // console.log('tempWallPoints.length', hoverPoint)

      if (hoverPoint) {
        const hoverScreenX = hoverPoint.x * zoomLevel + panOffset.x
        const hoverScreenY = hoverPoint.y * zoomLevel + panOffset.y
        drawPoint(ctx, hoverScreenX, hoverScreenY, '#b94242')
        ctx.setLineDash([])
        ctx.font = '24px Arial'
        ctx.textBaseline = 'middle'
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 3
        ctx.lineJoin = 'round'
        ctx.fillStyle = '#b94242ff'
        ctx.strokeText('ESC 结束', hoverScreenX, hoverScreenY + 20)
        ctx.fillText('ESC 结束', hoverScreenX, hoverScreenY + 20)

        // 绘制最后一个转角的角度标记
        if (tempWallPoints.length > 0) {
          const prev = tempWallPoints[tempWallPoints.length - 1]
          const prevScreenX = prev.x * zoomLevel + panOffset.x
          const prevScreenY = prev.y * zoomLevel + panOffset.y

          const screenX = hoverPoint.x * zoomLevel + panOffset.x
          const screenY = hoverPoint.y * zoomLevel + panOffset.y

          const dist = Math.round(Math.hypot(hoverPoint.x - prev.x, hoverPoint.y - prev.y))
          const midX = (screenX + prevScreenX) / 2
          const midY = (screenY + prevScreenY) / 2
          ctx.strokeText(`${dist}cm`, midX, midY)
          ctx.fillText(`${dist}cm`, midX, midY)
          if (tempWallPoints.length > 1) {
            const prev2 = tempWallPoints[tempWallPoints.length - 2]
            const prev2ScreenX = prev2.x * zoomLevel + panOffset.x
            const prev2ScreenY = prev2.y * zoomLevel + panOffset.y
            const angleResult = calculateAngle(
              { x: prev2ScreenX, y: prev2ScreenY },
              { x: prevScreenX, y: prevScreenY },
              { x: hoverScreenX, y: hoverScreenY }
            )
            if (angleResult !== null) {
              const { angle } = angleResult
              const angleText = `${Math.round(angle)}°`
              // 计算角度文本位置：在夹角内侧
              // 如果夹角太小（< 30度），显示在外侧；否则显示在内侧
              const offset = angle < 30 ? 15 : -15
              const angleX = prevScreenX - 10
              const angleY = prevScreenY + offset
              ctx.strokeText(angleText, angleX, angleY)
              ctx.fillText(angleText, angleX, angleY)
            }
          }
        }
      }
    }
  }

  draw2DWorld(
    canvasBgRef: HTMLCanvasElement | null,
    fileData: fileData,
    hoverPoint: Point | null,
    xAxisSnappedY: number | null,
    yAxisSnappedX: number | null,
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

    // 绘制轴对齐参考线
    if (hoverPoint) {
      // const hoverScreenX = hoverPoint.x * zoomLevel + panOffset.x
      // const hoverScreenY = hoverPoint.y * zoomLevel + panOffset.y
      ctx.strokeStyle = '#999'
      ctx.lineWidth = 1

      // 垂直线（y轴对齐）
      if (yAxisSnappedX !== null) {
        const screenX = yAxisSnappedX * zoomLevel + panOffset.x
        ctx.beginPath()
        ctx.moveTo(screenX, 0)
        ctx.lineTo(screenX, canvasHeight)
        ctx.stroke()
      }

      // 水平线（x轴对齐）
      if (xAxisSnappedY !== null) {
        const screenY = xAxisSnappedY * zoomLevel + panOffset.y
        ctx.beginPath()
        ctx.moveTo(0, screenY)
        ctx.lineTo(canvasWidth, screenY)
        ctx.stroke()
      }
    }
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
          if (item instanceof PointEntityClass) {
            setTimeout(() => {
              const boundingBox = item.createBoundingBox();
              if (boundingBox) {
                const data = item.getData();
                // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
                const [boxVector3, offsetVector3, rotateVector3] = boundingBox;
                item.boundingBoxData = [boxVector3, offsetVector3, rotateVector3]
                item.boundingBox.position.set(data.x, data.z, data.y)
                item.boundingBox.children[0].rotation.set(rotateVector3.x, rotateVector3.y, rotateVector3.z)
                item.boundingBox.children[0].scale.set(boxVector3.x, boxVector3.y, boxVector3.z)
                item.boundingBox.children[0].position.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)
                item.boundingBox.visible = false
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

  async add(type: string, data: BaseObjDataClass<any>[]) {
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
