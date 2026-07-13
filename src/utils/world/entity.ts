import * as THREE from 'three'
import { Point } from '../../types'
import { DoorEntity } from '@/entities/door/entity'
import { allFileKeys, EntityConstructor, fileData, fileDataKeyToClass } from '@/entities/index'
import { PointEntityClass } from '@/types/pointEntity'
import { ImportFileType, ImportImgType, ObjOutputFileType } from '@/entities/allObjs';
import { BaseEntityClass } from '@/types/baseEntity'
import { BaseObjData, HandelInfo } from '@/types/map2d'
import { CameraBase } from '@/types/CameraBase'
import { GroupData } from './index.d'

export const canvasHeight = 600
export const snapThreshold = 20
type WorldChangeType = 'add' | 'remove' | 'change'

export interface EnvironmentConfig {
  skyType: number
  ambientLightIntensity?: number
  showGround?: boolean
}

export class World {
  protected data: GroupData

  public children: BaseEntityClass<BaseObjData>[] = []

  private allObjectsByGroup: {
    [key in string]?: BaseEntityClass<BaseObjData>[]
  } = {}

  // 锁定状态的对象列表
  lockedObjList: BaseEntityClass<BaseObjData>[] = []

  activeCameraIndex: number = -1

  directionalLight: THREE.DirectionalLight | null = null

  isShowBoundingBox: boolean = true

  private circleRadius = 6
  type: string = 'group'

  constructor(data: GroupData) {
    this.data = data;

    (async () => {
      const apiList = [];
      for (const item of data.childrenData) {
        const type = item.type
        const EntityClassItem: EntityConstructor = fileDataKeyToClass[type];
        if (EntityClassItem) {
          const api = new EntityClassItem(this, item.value);
          await api.init()
          apiList.push(api)
          if (!this.allObjectsByGroup[type]) {
            this.allObjectsByGroup[type] = []
          }
          this.allObjectsByGroup[type].push(api)
          this.children.push(api)
          this.worldAddBindList.forEach(callback => callback(api))
          if (api.getData().isLocked) {
            this.lockedObjList.push(api)
          }
        }
      }
      if (apiList.length > 0) {
        this._callAllOnChangeCallback('add', apiList)
      }
    })();

    window.worldState.setEnvironMent()
  }

  draw2DPreview(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number
  ) {
    const data = this.getData();
    this.draw2DPreviewByData2(ctx, data, panOffset, zoomLevel)
  }

  draw2DPreviewByData2(
    ctx: CanvasRenderingContext2D,
    data: GroupData,
    panOffset: Point,
    zoomLevel: number,
  ) {
    // 绘制墙体
    const allObj: BaseEntityClass<BaseObjData>[] = [];
    this.children.forEach(item => {
      if (item.type !== 'pointGroup') {
        allObj.push(item)
      }
    })
    allObj.sort((a, b) => {
      let aZ = 0;
      if (a instanceof PointEntityClass) {
        const aData = a.getData()
        aZ = aData.z + (a.boundingBoxData ? a.boundingBoxData[0].y : 0)
      }
      let bZ = 0;
      if (b instanceof PointEntityClass) {
        const bData = b.getData()
        bZ = bData.z + (b.boundingBoxData ? b.boundingBoxData[0].y : 0)
      }
      return aZ - bZ
    }).forEach((item) => {
      item.draw2DPreview(ctx, panOffset, zoomLevel)
    })

    // 绘制所有ObjFile的中心点
    // this.allObjFiles.forEach((item) => {
    //   drawPoint(ctx, item.x * zoomLevel + panOffset.x, item.y * zoomLevel + panOffset.y, '#42b983')
    // })
  }

  draw2DHandleByData() {
    // 暂无操作句柄
  }

  // 绘制操作句柄
  // draw2DActionHandle(
  //   canvasActionRef: HTMLCanvasElement,
  //   fileData: fileData,
  //   panOffset: Point = { x: 0, y: 0 },
  //   zoomLevel: number = 1,
  // ) {
  //   const ctxAction = canvasActionRef.getContext('2d')!
  //   ctxAction.clearRect(0, 0, canvasActionRef.width, canvasActionRef.height)
  //   allFileKeys.forEach((key) => {
  //     if (fileData[key]) {
  //       fileData[key].forEach((item, index) => {
  //         // @ts-ignore
  //         const itemApi: DoorEntity = this.allFileMapObjects[key][index];
  //         if (itemApi) {
  //           itemApi.draw2D(ctxAction, panOffset, zoomLevel)
  //         }
  //       })
  //     }
  //   })
  // }

  getTypeObjectsData(type: string) {
    const returnData: BaseObjData[] = [];
    this.getTypeListEntity(type).forEach((item) => {
      returnData.push(item.getData())
    })
    return returnData
  }

  boundingBoxList(): THREE.Group[] {
    const boundingBoxList: THREE.Group[] = []
    this.children.forEach((item) => {
      if (item instanceof PointEntityClass && item.boundingBox) {
        boundingBoxList.push(item.boundingBox)
      }
    });
    return boundingBoxList
  }

  moveZBoxList(): THREE.Group[] {
    const boundingBoxList: THREE.Group[] = []
    this.children.forEach((item) => {
      if (item instanceof PointEntityClass && item.moveZBox) {
        boundingBoxList.push(item.moveZBox)
      }
    });
    console.log('boundingBoxList-1', boundingBoxList)
    return boundingBoxList
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    // const { width, height, depth, angleY } = this.children[0].getData();
    const { angleY } = this.getData();
    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    return [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, angleY, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    const drawAngelLength = 100;// Math.max(this.getData().width / 2, this.circleRadius * 2) * 0.9;// 0.9避免超过方块范围
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
    // const { x, y } = position
    // if (matchHandelInfo.index === 0) {
    //   this.changePosition({ x, y })
    // } else if (matchHandelInfo.index === 1) {
    //   const data = this.getData();
    //   // 根据x,y计算angleY
    //   const angleY = Math.atan2(y - data.y, x - data.x)
    //   this.setData({
    //     ...this.getData(),
    //     angleY: angleY * -1,
    //   })
    // }
  }

  getMineBeSnapPoints() {
    return []
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  inSceneSnapPointArea() {
    return false
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

  meshNeedChangeKey() {
    const data = this.getData();
    const cacheData = {
      ...data,
      x: undefined,
      y: undefined,
      z: undefined,
      angleY: undefined,
    }
    return this.type + JSON.stringify(cacheData)
  }

  // 改变3D模型的状态
  // 例如：改变位置，旋转角度等，模型本身不变
  change3DMeshState(): void {
    // const data = this.getData();
    // this.meshList.forEach(v => {
    //   v.position.set(data.x, data.z, data.y)
    //   v.rotation.y = data.angleY
    // })
  }

  // associationEntity: BaseEntityClass<any>[] = []// 关联对象，就是本对象渲染，需要联动修改的对象。（比如：墙壁上被窗户挖洞，那么墙修改，需要重新挖洞）

  setData(data: GroupData) {
    // this.data = data
    // // 双向去除原有的关联对象
    // this.associationEntity.forEach(entity => {
    //   if (entity.associationEntity.includes(this)) {
    //     entity.markObjectIsDirty()
    //   }
    // })
    // this.world._callObjDataChange(this)
  }

  draw3D() {
    this.children.forEach(item => {
      item.reCreate3DMeshIfNeed()
      item.change3DMeshState()
      if (item instanceof PointEntityClass && !(item instanceof CameraBase)) {
        setTimeout(() => {
          const boundingBox = item.createBoundingBox();
          if (boundingBox && this.isShowBoundingBox) {
            const data = item.getData();
            // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
            const [boxVector3, offsetVector3, rotateVector3] = boundingBox;
            item.boundingBoxData = [boxVector3, offsetVector3, rotateVector3]
            item.boundingBox.position.set(data.x, data.z, data.y)
            item.boundingBox.children[0].rotation.set(rotateVector3.x, rotateVector3.y, rotateVector3.z)
            item.boundingBox.children[0].scale.set(boxVector3.x, boxVector3.y, boxVector3.z)
            item.boundingBox.children[0].position.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)

            item.boundingBox.children[1].rotation.set(rotateVector3.x, rotateVector3.y, rotateVector3.z)
            item.boundingBox.children[1].scale.set(boxVector3.x, boxVector3.y, boxVector3.z)
            item.boundingBox.children[1].position.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)

            item.boundingBox.visible = this.isShowBoundingBox
            if (item.spriteGroup) {
              item.spriteGroup.position.set(data.x, data.z, data.y)
              item.spriteGroup.children[0].position.set(0, boxVector3.y / 2 + offsetVector3.y + 12, 0)
            }
            if (item.moveZBox) {
              item.moveZBox.position.set(data.x, data.z, data.y)
              // const height = Math.max(Math.min(40, boxVector3.y), 20);
              const radio = Math.max(Math.min(boxVector3.x / 8, boxVector3.z / 8, 20), 8);
              const height = radio * 3;
              item.moveZBox.children[0].scale.set(
                radio,
                height,
                radio
              )
              item.moveZBox.children[0].position.set(offsetVector3.x, boxVector3.y / 2 + height / 2 + offsetVector3.y, offsetVector3.z)
              item.moveZBox.visible = false
            }
          } else {
            item.boundingBox.visible = false
          }
        })
      }
    })
  }

  getAllFileObjects(): fileData {
    const returnData: fileData = {};
    allFileKeys.forEach((key) => {
      returnData[key] = []
      if (this.getTypeListEntity(key)) {
        (this.getTypeListEntity(key) as PointEntityClass<any>[]).forEach((item) => {
          // @ts-ignore
          returnData[key].push(item.getData())
        })
      }
    })
    return returnData
  }

  async add(type: string, data: BaseObjData[]): Promise<BaseEntityClass<any>[]> {
    const EntityClassItem: EntityConstructor = fileDataKeyToClass[type] as any;
    if (!this.allObjectsByGroup[type]) {
      this.allObjectsByGroup[type] = []
    }
    const apiList = [];
    for (let i = 0; i < data.length; i++) {
      const api: BaseEntityClass<any> = new EntityClassItem(this, data[i]);
      await api.init()
      apiList.push(api);
      this.allObjectsByGroup[type].push(api)
      this.data.childrenData.push(api.getData())
      this.children.push(api);
      this.worldAddBindList.forEach(callback => callback(api))
      if (api.getData().isLocked) {
        this.lockedObjList.push(api)
      }
    }
    this._callAllOnChangeCallback('add', apiList)
    return apiList;
  }

  delete(type: string, index: number) {
    if (this.allObjectsByGroup[type]) {
      const backup = this.allObjectsByGroup[type][index];
      this.allObjectsByGroup[type][index].beforeRemove()
      this.allObjectsByGroup[type].splice(index, 1)

      const index2 = this.children.indexOf(backup)
      this.children.splice(index2, 1)
      this.data.childrenData.splice(index2, 1)

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
      if (this.allObjectsByGroup[type]) {
        (this.allObjectsByGroup[type] as BaseEntityClass<any>[]).forEach((item) => {
          willRemoveList.push(item);
        });
      }
    })
    allFileKeys.forEach((type) => {
      if (this.allObjectsByGroup[type]) {
        (this.allObjectsByGroup[type] as BaseEntityClass<any>[]).forEach((item) => {
          if (item.getData().isLocked) {
            const index = this.lockedObjList.indexOf(item)
            if (index !== -1) {
              this.lockedObjList.splice(index, 1)
            }
          }
          item.beforeRemove()
        });
        this.allObjectsByGroup[type] = []
      }
    })
    this.data.childrenData = []
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

  getData(): GroupData {
    return this.data
  }

  getTypeListEntity(key: string): BaseEntityClass<BaseObjData>[] {
    return this.allObjectsByGroup[key] || []
  }

  getAllObjectTypes() {
    return Object.keys(this.allObjectsByGroup)
  }

  getAllObjectCount() {
    return this.children.length
  }
}
