import * as THREE from 'three'
import { fileDataKeyToClass } from '@/entities/index'
import { editItem } from '@/utils/editItem'
import { PointEntityClass } from '@/types/pointEntity'
import { BaseEntityClass, EntityConstructor } from '@/types/baseEntity'
import { BaseObjData, HandelInfo, Point } from '@/types/map2d'
import { GroupBaseData } from '.'
import drawAxes from '@/utils/drawAxes'

type WorldChangeType = 'add' | 'remove' | 'change'

export abstract class GroupBaseEntity<T extends GroupBaseData> extends PointEntityClass<T> {
  group: THREE.Scene | THREE.Group = new THREE.Group()
  width: number = 0;
  height: number = 0;
  showAxes: boolean = true;

  public children: BaseEntityClass<BaseObjData>[] = []

  private allObjectsByGroup: {
    [key in string]?: BaseEntityClass<BaseObjData>[]
  } = {}

  // 锁定状态的对象列表
  lockedObjList: BaseEntityClass<BaseObjData>[] = []

  constructor(parent: GroupBaseEntity<T> | null, data: T) {
    super(parent, data)
    this.data = data;

    // group添加一个方块
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)
    this.group.add(cube);

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
    panOffset: Point,
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

  getSize(): [number, number, number] {
    return [100, 100, 100]
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const [width, height, depth] = this.getSize()
    // const { width, height, depth, angleY } = this.children[0].getData();
    const { angleY } = this.getData();
    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    return [
      new THREE.Vector3(width, height, depth),
      new THREE.Vector3(0, height / 2, 0),
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

  changeBoundingBoxState() {
    console.log('changeBoundingBoxState')
    super.changeBoundingBoxState();
    this.children.forEach(item => {
      if (item instanceof PointEntityClass) {
        item.changeBoundingBoxState()
      }
    })
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
}
