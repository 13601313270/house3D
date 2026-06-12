import * as THREE from 'three'
import { HandelInfo, Point, BaseObj } from './map2d'
import { World } from '@/utils/world'
import { editItem } from '@/entities'
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea'
import { OrigionSnapPoint } from './pointEntity'

export abstract class BaseEntityClass<T extends BaseObj> {
  abstract name: string
  abstract type: string
  world: World;
  protected data: T
  meshList: THREE.Group[] = []
  // eslint-disable-next-line
  associationEntity: BaseEntityClass<any>[] = []// 关联对象，就是本对象渲染，需要联动修改的对象。（比如：墙壁上被窗户挖洞，那么墙修改，需要重新挖洞）

  constructor(world: World, data: T) {
    this.world = world
    this.data = data || this.defaultValue();
    console.log(world, data)
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

  protected cacheKeyStr = '';
  public remove3DCache() {
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

  abstract meshNeedChangeKey(): string

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

  abstract editPropConfig(
    snapPoint: HandelInfo,
    editShow: (editInfoList: editItem[], callback: (val: any) => void) => void,
    close: () => void,
  ): void

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

  reCreate3DMeshIfNeed(): void {
    const newKeyByData = this.meshNeedChangeKey();
    if (this.cacheKeyStr === newKeyByData) {
      return;
    }
    console.log('reCreate3DMeshIfNeed', this.cacheKeyStr, newKeyByData)
    const scene: THREE.Scene = this.world.scene
    this.meshList.forEach(mesh => scene.remove(mesh))
    this.meshList = this.create3DMesh(scene);
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
  }, matchHandelInfo: HandelInfo): void;

  // 本对象可以被其他对象对齐参考点（注意是被对齐，提供给其他拖动磁吸的参考点）
  abstract getMineBeSnapPoints(): Array<OrigionSnapPoint>;

  // 本对象可以被其他对象对齐的参考线（注意是被对齐，提供个其他拖动磁吸的参考线）
  abstract getMineBeSnapLines(): Array<[Point, Point]>;

  draw2DPreview(ctx: CanvasRenderingContext2D, panOffset: Point, zoomLevel: number) {
    const data = this.getData();
    this.draw2DPreviewByData(ctx, data, panOffset, zoomLevel)
  }
}