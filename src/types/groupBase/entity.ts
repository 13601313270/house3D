import * as THREE from 'three'
import { fileDataKeyToClass } from '@/entities/index'
import { editItem } from '@/utils/editItem'
import { PointEntityClass } from '@/types/pointEntity'
import { BaseEntityClass, EntityConstructor } from '@/types/baseEntity'
import { BaseObjData, HandelInfo, Point } from '@/types/map2d'
import { GroupBaseData } from '.'
import drawAxes from '@/utils/drawAxes'
import canvas2DSceneManage from '@/utils/canvas2DSceneManage'

type WorldChangeType = 'add' | 'remove' | 'change'

export abstract class GroupBaseEntity<T extends GroupBaseData> extends PointEntityClass<T> {
  group: THREE.Group = new THREE.Group()
  width: number = 0;
  height: number = 0;
  showAxes: boolean = true;
  private gridHelper: THREE.GridHelper
  private axesHelper: THREE.AxesHelper
  insertTempObj: BaseEntityClass<any> | null = null;// 待添加的对象（还没有鼠标按下完成添加）

  public children: BaseEntityClass<BaseObjData>[] = []

  private allObjectsByGroup: {
    [key in string]?: BaseEntityClass<BaseObjData>[]
  } = {}

  // 锁定状态的对象列表
  lockedObjList: BaseEntityClass<BaseObjData>[] = []

  constructor(parent: GroupBaseEntity<T> | null, data: T) {
    super(parent, data)
    this.data = data;

    this.gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
    this.gridHelper.layers.set(2)
    this.gridHelper.visible = false;
    this.group.add(this.gridHelper)

    this.axesHelper = new THREE.AxesHelper(100)
    this.axesHelper.layers.set(2)
    this.axesHelper.visible = false;
    this.axesHelper.setColors(
      new THREE.Color(0xff0000),
      new THREE.Color(0x0000ff),
      new THREE.Color(0x00ff00)
    )
    this.group.add(this.axesHelper);

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
  }

  draw2DPreview(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ) {
    const data = this.getData();
    const { angleY } = data
    const screenX = data.x * zoomLevel;
    const screenY = data.y * zoomLevel;

    const allObj: BaseEntityClass<BaseObjData>[] = [];
    this.children.forEach(item => {
      if (item.type !== 'pointGroup') {
        allObj.push(item)
      }
    })
    if (this.insertTempObj) {
      allObj.push(this.insertTempObj)
    }
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
    })

    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(angleY * -1)

    allObj.forEach((item) => {
      item.draw2DPreview(ctx, zoomLevel)
    })

    // 绘制轴
    ctx.restore()
    drawAxes(ctx, angleY * -1, zoomLevel, this.width, this.height)
  }

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ) {
    // 暂无操作句柄
  }

  create3DMesh(): THREE.Group[] {
    const group = this.group;// as new THREE.Group()
    group.clear()
    this.children.forEach((item) => {
      item.create3DMesh().forEach(mesh => group.add(mesh))
    })
    // @ts-ignore
    return [group]
  }

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
      if (item instanceof PointEntityClass && item.boundingBox && !item.getData().isLocked) {
        boundingBoxList.push(item.boundingBox)
      }
    });
    return boundingBoxList
  }

  moveZBoxList(): THREE.Group[] {
    const boundingBoxList: THREE.Group[] = []
    this.children.forEach((item) => {
      if (item instanceof PointEntityClass && item.moveZBox && !item.getData().isLocked) {
        boundingBoxList.push(item.moveZBox)
      }
    });
    return boundingBoxList
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null {
    let minX = 0
    let maxX = 0
    let minY = 0
    let maxY = 0
    let minZ = 0
    let maxZ = 0
    if (this.children) {
      this.children.forEach(item => {
        if (item instanceof PointEntityClass && item.boundingBoxData) {
          const { x, y, z } = item.getData()
          // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
          const boxData = item.boundingBoxData;
          if (boxData) {
            minX = Math.min(minX, x - boxData[0].x / 2)
            maxX = Math.max(maxX, x + boxData[0].x / 2)
            minY = Math.min(minY, y - boxData[0].y / 2)
            maxY = Math.max(maxY, y + boxData[0].y / 2)
            minZ = Math.min(minZ, z - boxData[0].y / 2)
            maxZ = Math.max(maxZ, z + boxData[0].y / 2)
          }
        }
      })
    }
    // 预留padding
    minX -= 10;
    maxX += 10;
    minY -= 10;
    maxY += 10;
    minZ -= 10;
    maxZ += 10;
    const width = maxX - minX
    const depth = maxY - minY
    const height = maxZ - minZ
    const { angleY } = this.getData();
    const offsetX = minX + width / 2
    const offsetZ = minY + depth / 2
    // 计算偏移位置（考虑旋转）
    const finalOffsetX = offsetX * Math.cos(angleY) + offsetZ * Math.sin(angleY);
    const finalOffsetZ = -offsetX * Math.sin(angleY) + offsetZ * Math.cos(angleY);
    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    return [
      new THREE.Vector3(width, height, depth),
      new THREE.Vector3(
        finalOffsetX,
        height / 2,
        finalOffsetZ
      ),
      new THREE.Vector3(0, angleY, 0)
    ]
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

  needChangeKey() {
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
    this.children.forEach(item => {
      item.change3DMeshState()
    })
  }

  reCreate3DMeshIfNeed() {
    this.children.forEach(item => {
      item.reCreate3DMeshIfNeed()
    })
  }

  async add(type: string, data: BaseObjData[]): Promise<BaseEntityClass<BaseObjData>[]> {
    const EntityClassItem: EntityConstructor = fileDataKeyToClass[type] as any;
    if (!this.allObjectsByGroup[type]) {
      this.allObjectsByGroup[type] = []
    }
    const apiList = [];
    for (let i = 0; i < data.length; i++) {
      const api: BaseEntityClass<BaseObjData> = new EntityClassItem(this, data[i]);
      await api.init()
      apiList.push(api);
      this.allObjectsByGroup[type].push(api)
      this.data.childrenData.push({
        type,
        value: api.getData(),
      })
      this.children.push(api);
      this.worldAddBindList.forEach(callback => callback(api))
      if (api.getData().isLocked) {
        this.lockedObjList.push(api)
      }
      canvas2DSceneManage.renderPreview()
      api.reCreate3DMeshIfNeed();
      api.change3DMeshState()
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
      canvas2DSceneManage.renderPreview()
      this.reCreate3DMeshIfNeed()
      this.change3DMeshState()
      this._callAllOnChangeCallback('remove', [backup])
    }
  }

  clearAll() {
    const willRemoveList: BaseEntityClass<BaseObjData>[] = [];
    this.children.forEach(item => {
      if (item instanceof PointEntityClass) {
        willRemoveList.push(item)
      }
    })
    this.lockedObjList = [];
    this.children.forEach(item => {
      item.beforeRemove()
    })
    this.allObjectsByGroup = {}
    this.children = []
    this.data.childrenData = []
    canvas2DSceneManage.renderPreview()
    this.reCreate3DMeshIfNeed()
    this.change3DMeshState()
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

  getData(): T {
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

  editPropConfig(
    snapPoint: HandelInfo,
    editShow: (editInfoList: editItem[], callback: (val: any) => void) => void,
    close: () => void,
  ): void {
  }

  showGridHelper() {
    this.gridHelper.visible = true;
  }

  showAxesHelper() {
    this.axesHelper.visible = true;
  }
}
