import * as THREE from 'three'
import { HandelInfo, Point, BaseObjData, PointWithIndex } from './map2d'
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea'
import { editItem } from '@/utils/editItem'
import { GroupBaseEntity } from './groupBase/entity'
import { GroupBaseData } from './groupBase'

export type allSnapFromType = 'point' | 'line' | 'axis'
// 磁吸点
export type OrigionSnapPoint = {
  objType: string, // 磁吸点对象类型
  snapFromType: 'point', // 磁吸点来源类型
  point: PointWithIndex,
}
// 磁吸点(扩展)，通过其他计算延伸出来的磁吸，比如贴边，贴发现
export type MatchSnapPoint = OrigionSnapPoint | {
  objType: string, // 磁吸点对象类型
  snapFromType: 'line' | 'axis' | string, // 磁吸点来源类型
  point: Point,
}

export abstract class BaseEntityClass<T extends BaseObjData> {
  abstract name: string
  abstract type: string
  parentEntity: GroupBaseEntity<GroupBaseData> | null;
  protected data: T
  meshList: THREE.Group[] = []
  boundingBoxData: [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null = null // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  // eslint-disable-next-line
  associationEntity: BaseEntityClass<any>[] = []// 关联对象，就是本对象渲染，需要联动修改的对象。（比如：墙壁上被窗户挖洞，那么墙修改，需要重新挖洞）

  constructor(parentEntity: GroupBaseEntity<GroupBaseData> | null, data: T) {
    this.parentEntity = parentEntity
    this.data = data
    this.reBuildBoundingBoxData()
  }

  init(): Promise<void> {
    return Promise.resolve()
  }

  // 获取包裹立方体的数据
  abstract getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度

  reBuildBoundingBoxData() {
    this.boundingBoxData = this.getBoundingBoxData()
    setTimeout(() => {
      if (this.parentEntity) {
        this.parentEntity.reBuildBoundingBoxData()
      }
    })
  }

  setData(data: T) {
    this.data = data
    this.reBuildBoundingBoxData();
    // 双向去除原有的关联对象
    this.associationEntity.forEach(entity => {
      if (entity.associationEntity.includes(this)) {
        entity.markObjectIsDirty()
      }
    })
    if (this.parentEntity) {
      this.parentEntity._callObjDataChange(this)
    }
  }

  getData(): T {
    return this.data
  }

  // 生成3D模型
  abstract create3DMesh(): THREE.Group[]

  protected cacheKeyStr = '';
  public markObjectIsDirty() {
    if (this.cacheKeyStr) {
      this.cacheKeyStr = ''
      if (this.associationEntity.length > 0) {
        this.associationEntity.forEach(entity => {
          entity.markObjectIsDirty()
        })
      }
    }
  }

  abstract meshNeedChangeKey(): string

  // 本对象的2D预览绘制，（时间早于draw2DByData）
  abstract draw2DPreview(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void;

  // 本对象的2D具柄绘制逻辑（时间晚于draw2DPreview）draw2DActionHandle
  abstract draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number,
  ): void;

  abstract editPropConfig(
    snapPoint: HandelInfo,
    editShow: (editInfoList: editItem[], callback: (val: any) => void) => void,
    close: () => void,
  ): void

  beforeRemove() {
    if (!this.parentEntity) return
    const scene: THREE.Scene | THREE.Group = this.parentEntity.group;
    this.markObjectIsDirty()
    this.meshList.forEach(mesh => scene.remove(mesh))
    if (this.associationEntity.length > 0) {
      this.associationEntity.forEach(entity => {
        const index = entity.associationEntity.indexOf(this)
        if (index !== -1) {
          entity.associationEntity.splice(index, 1)
        }
      })
    }
    this.associationEntity = []
  }

  reCreate3DMeshIfNeed(): void {
    const newKeyByData = this.meshNeedChangeKey();
    if (this.cacheKeyStr === newKeyByData) {
      return;
    }
    if (!this.parentEntity) return
    const scene: THREE.Scene | THREE.Group = this.parentEntity.group;
    this.meshList.forEach(mesh => scene.remove(mesh))
    this.meshList = this.create3DMesh();
    this.meshList.forEach(mesh => scene.add(mesh))
    this.cacheKeyStr = newKeyByData;
  }

  // 显示可拖拽具柄
  abstract showMatchHandel(x: number, y: number): MatchRectArea | MatchCircleArea | null;

  // 命中可拖拽具柄
  abstract matchHandelInfo(x: number, y: number): HandelInfo | null;

  // 命中可拖拽具柄被移动
  abstract matchHandelMoveCallback(position: {
    x: number,
    y: number,
    startX?: number,
    startY?: number,
  }, matchHandelInfo: HandelInfo): string[] | void;

  // 本对象可以被其他对象对齐参考点（注意是被对齐，提供给其他拖动磁吸的参考点）
  abstract getMineBeSnapPoints(handle: HandelInfo): Array<OrigionSnapPoint>;

  // 本对象可以被其他对象对齐的参考线（注意是被对齐，提供个其他拖动磁吸的参考线）
  abstract getMineBeSnapLines(): Array<[Point, Point]>;

  abstract change3DMeshState(): void

  // 本对象进入一个吸附点的区域
  abstract inSceneSnapPointArea(
    newPosition: MatchSnapPoint,
    dragHandelInfo: HandelInfo,
  ): boolean;
}

export type EntityConstructor = new (world: GroupBaseEntity<GroupBaseData>, data: BaseObjData) => BaseEntityClass<any>;
