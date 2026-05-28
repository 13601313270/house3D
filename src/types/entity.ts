import * as THREE from 'three'
import { ObjData, HandelInfo, Point, PointWithIndex } from './map2d'
import { World } from '@/utils/world'
import { editItem } from '@/entities'
import { MatchRectArea, MatchCircleArea } from '@/utils/matchArea'

export type allSnapFromType = 'point' | 'line' | 'axis'
// 磁吸点
export type OrigionSnapPoint = {
  objType: string, // 磁吸点对象类型
  snapFromType: 'point', // 磁吸点来源类型
  objId: string, // 磁吸点对象ID
  point: PointWithIndex,
}
// 磁吸点(扩展)，通过其他计算延伸出来的磁吸，比如贴边，贴发现
export type MatchSnapPoint = OrigionSnapPoint | {
  objType: string, // 磁吸点对象类型
  objId: string, // 磁吸点对象ID
  snapFromType: 'line' | 'axis' | string, // 磁吸点来源类型
  point: Point,
}

export abstract class EntityClass<T extends ObjData> {
  abstract name: string
  abstract type: string
  abstract isPointObj: boolean // 点状对象，如窗户/门。非点状的如墙
  world: World;
  private data: T
  meshList: THREE.Group[] = []
  // eslint-disable-next-line
  associationEntity: EntityClass<any>[] = []// 关联对象，就是本对象渲染，需要联动修改的对象。（比如：墙壁上被窗户挖洞，那么墙修改，需要重新挖洞）

  constructor(world: World, data?: T) {
    this.world = world
    this.data = data || this.defaultValue()
  }

  init(): Promise<void> {
    return Promise.resolve()
  }

  abstract defaultValue(): T

  setData(data: T) {
    this.data = data
    this.world._callAllOnChangeCallback()
  }

  getData(): T {
    return this.data
  }

  // 生成3D模型
  abstract create3DMesh(scene: THREE.Scene, ...args: any[]): THREE.Group[]

  private cacheKeyStr = '';
  reCreate3DMeshIfNeed(): void {
    const newKeyByData = this.meshNeedChangeKey();
    if (this.cacheKeyStr !== newKeyByData) {
      const scene: THREE.Scene = this.world.scene
      this.meshList.forEach(mesh => scene.remove(mesh))
      this.meshList = this.create3DMesh(scene)
      this.meshList.forEach(mesh => scene.add(mesh))
      this.cacheKeyStr = newKeyByData
    }
  }

  public remove3DCache() {
    // 这里注意防止死循环
    // console.log('remove3DCache')
    if (this.meshList.length) {
      this.meshList.forEach(mesh => this.world.scene.remove(mesh))
      this.meshList = []
    }
    if (this.cacheKeyStr) {
      this.cacheKeyStr = ''
      if (this.associationEntity.length > 0) {
        this.associationEntity.forEach(entity => {
          entity.remove3DCache()
        })
      }
    }
  }

  // 当前对象是否需要重新生成3D模型状态
  meshNeedChangeKey(): string {
    const cacheData = {
      ...this.data,
      x: undefined,
      y: undefined,
      z: undefined,
    }
    return this.type + JSON.stringify(cacheData)
  }

  // 改变3D模型的状态
  // 例如：改变位置，旋转角度等
  change3DMeshState(): void {
    this.meshList.forEach(v => {
      v.position.set(this.data.x, this.data.z, this.data.y)
    })
  }

  // 显示可拖拽具柄
  abstract showMatchHandel(x: number, y: number): MatchRectArea | MatchCircleArea | null;

  // 命中可拖拽具柄
  abstract matchHandelInfo(x: number, y: number): HandelInfo | null;

  // 命中可拖拽具柄被移动移动
  abstract matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo): void;

  // 本对象进入一个吸附对象的区域
  abstract inSceneSnapPointArea(
    newPosition: MatchSnapPoint,
    dragHandelInfo: HandelInfo,
  ): boolean;

  // 当前对象进入到一根吸附线的区域
  abstract inSceneSnapLineArea(
    obj: EntityClass<ObjData>,
    line: [Point, Point],
    point: Point,
  ): boolean;

  // 当前对象不在任何一根吸附线的区域
  notInSceneSnapLineArea(): void { }

  // 本对象可以被其他对象对齐参考点（注意是被对齐，提供个其他拖动磁吸的参考点）
  abstract getMineBeSnapPoints(): Array<OrigionSnapPoint>;

  // 本对象可以被其他对象对齐的参考线（注意是被对齐，提供个其他拖动磁吸的参考线）
  abstract getMineBeSnapLines(): Array<[Point, Point]>;

  draw2DPreview(ctx: CanvasRenderingContext2D, panOffset: Point, zoomLevel: number) {
    const data = this.getData();
    this.draw2DPreviewByData(ctx, data, panOffset, zoomLevel)
  }

  // 本对象的2D预览绘制，（时间早于draw2DByData）
  abstract draw2DPreviewByData(
    ctx: CanvasRenderingContext2D,
    data: T,
    panOffset: Point,
    zoomLevel: number,
  ): void;

  // 本对象的2D具柄绘制逻辑（时间晚于draw2DPreview）
  abstract draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: T,
    panOffset: Point,
    zoomLevel: number,
  ): void;

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number,
  ) {
    const data = this.getData();
    this.draw2DByData(ctx, data, panOffset, zoomLevel)
  }

  changePosition(newPosition: { x: number, y: number }) {
    this.data.x = newPosition.x
    this.data.y = newPosition.y
    this.world._callAllOnChangeCallback()
  }

  // 待添加状态（鼠标新增悬浮的时候）
  abstract setPrepareState(x: number, y: number, ...args: any[]): void

  beforeRemove() {
    const scene: THREE.Scene = this.world.scene
    this.remove3DCache()
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

  abstract editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void
}
