import * as THREE from 'three'
import { HandelInfo, Point, BaseObjData, PointWithIndex } from './map2d'
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea'
import { editItem } from '@/utils/editItem'
import { GroupBaseEntity } from './groupBase/entity'
import { GroupBaseData } from './groupBase'
import canvas2DSceneManage from '@/utils/canvas2DSceneManage'
import { timelineState } from '@/utils/timelineManage'
import generateClipId from '@/utils/generateClipId'

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
  private data: T
  private animationData: Partial<T> // 临时数据，播放动画的时候，动画效果对应的data
  meshGroup: THREE.Group = new THREE.Group()
  boundingBoxData: [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null = null // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  // eslint-disable-next-line
  associationEntity: BaseEntityClass<any>[] = []// 关联对象，就是本对象渲染，需要联动修改的对象。（比如：墙壁上被窗户挖洞，那么墙修改，需要重新挖洞）

  protected cacheCanvas: HTMLCanvasElement
  protected cacheCtx: CanvasRenderingContext2D

  constructor(parentEntity: GroupBaseEntity<GroupBaseData> | null, data: T) {
    this.parentEntity = parentEntity
    this.data = data
    this.animationData = {};
    this.cacheCanvas = document.createElement("canvas")
    this.cacheCanvas.width = 100
    this.cacheCanvas.height = 100
    this.cacheCtx = this.cacheCanvas.getContext("2d")!
  }

  init(): Promise<void> {
    return Promise.resolve()
  }

  // 获取包裹立方体的数据
  abstract getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度

  reBuildBoundingBoxData() {
    this.boundingBoxData = this.getBoundingBoxData()
    const newKeyByData = this.create3DUnionKey();
    if (this.cacheKeyStr === newKeyByData) {
      return;
    }
    setTimeout(() => {
      if (this.parentEntity) {
        this.parentEntity.reBuildBoundingBoxData()
      }
    })
  }

  setData(data: Partial<T>) {
    if (timelineState.isPlaying) {
      let findClip = timelineState.timelineData.clips.find(v => v.entityId === this.data.id);
      if (!findClip) {
        timelineState.timelineData.clips.push({
          entityId: this.data.id,
          clipId: generateClipId(),
          startTime: timelineState.currentTime,
          endTime: timelineState.currentTime + 1,
          columns: [],
        })
        findClip = timelineState.timelineData.clips.find(v => v.entityId === this.data.id)
      }
      if (findClip) {
        Object.keys(data).forEach((key) => {
          const findTrack = findClip.columns.find(v => v.trackType === key)
          if (findTrack) {
            const keyTimePoints = [...findTrack.keyTimePoints];
            // console.log(222222, keyTimePoints)
            if (keyTimePoints.find(v => v.time === timelineState.currentTime)) {
              const index = keyTimePoints.findIndex(v => v.time === timelineState.currentTime)
              // @ts-ignore
              keyTimePoints[index].value = data[key]
              findTrack.keyTimePoints = keyTimePoints;
            } else {
              keyTimePoints.push({
                type: 'point',
                time: timelineState.currentTime,
                // @ts-ignore
                value: data[key],
              })
              findTrack.keyTimePoints = keyTimePoints.sort((a, b) => a.time - b.time);
            }
          } else {
            findClip.columns.push({
              trackType: key,
              keyTimePoints: [{
                type: 'point',
                time: timelineState.currentTime,
                // @ts-ignore
                value: data[key],
              }]
            })
          }
        })

        // 如果timelineState.currentTime，在findClip.startTime和findClip.endTime之外，那么调整findClip.startTime和findClip.endTime，包括进这个时间
        if (timelineState.currentTime < findClip.startTime) {
          findClip.startTime = timelineState.currentTime;
        }
        if (timelineState.currentTime > findClip.endTime) {
          findClip.endTime = timelineState.currentTime;
        }

        this.setAnimationData({
          ...this.animationData,
          ...data,
        })

        timelineState.timelineData = {
          ...timelineState.timelineData
        };
      }
    } else {
      this.data = {
        ...this.data,
        ...data
      }
    }

    this.update();
  }

  setAnimationData(data: Partial<T>) {
    // 过滤掉data中值为undefined的key
    const filteredData: Partial<T> = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        (filteredData as any)[key] = value;
      }
    });
    // data = filteredData;
    this.animationData = filteredData;
    this.update();
  }

  getData(): T {
    if (timelineState.isPlaying) {
      return {
        ...this.data,
        ...this.animationData
      };
    } else {
      return this.data
    }
  }

  getAnimationData(): Partial<T> {
    return this.animationData;
  }

  getOriginalData(): T {
    return this.data
  }

  private update() {
    canvas2DSceneManage.renderPreview()
    this.reCreate3DMeshAnd2DPreviewIfNeed()
    this.change3DMeshState()
    this.reBuildBoundingBoxData();
    // 双向去除原有的关联对象
    this.associationEntity.forEach(entity => {
      if (entity.associationEntity.includes(this)) {
        entity.markObjectIsDirty()
      }
    })
    this.associationEntity.forEach(entity => {
      if (entity.associationEntity.includes(this)) {
        entity.reCreate3DMeshAnd2DPreviewIfNeed()
        entity.change3DMeshState()
      }
    })
    if (this.parentEntity) {
      this.parentEntity._callObjDataChange(this)
    }
    this.reCreate3DMeshAnd2DPreviewIfNeed() // 第二次reCreate3DMeshIfNeed，我也不知道为什么必须加，但是不加上，挂在墙上的门，拖动y轴的时候，墙不会刷新渲染
    this.parentEntity?.change3DMeshState()
  }

  // 生成3D模型
  abstract create3DMesh(): THREE.Group

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

  // 生成当前对象唯一的3D模型key，用于判断当前3D对象是否需要重新生成3D模型状态，
  abstract create3DUnionKey(): string

  // 本对象的2D预览绘制，（时间早于draw2DByData）
  abstract draw2DPreview(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void;

  // 本对象的2D具柄绘制逻辑（时间晚于draw2DPreview）draw2DActionHandle
  abstract draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void;

  abstract getEditPropConfigData(data: T): editItem[] | Promise<editItem[]>;

  abstract editPropConfig(
    snapPoint: HandelInfo,
    editShow: (editInfoList: editItem[], callback: (val: any) => void) => void,
    close: () => void,
  ): void

  beforeRemove() {
    if (!this.parentEntity) return
    const scene: THREE.Scene | THREE.Group = this.parentEntity.group;
    this.markObjectIsDirty()
    scene.remove(this.meshGroup)
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

  reCreate3DMeshAnd2DPreviewIfNeed(): void {
    const newKeyByData = this.create3DUnionKey();
    if (this.cacheKeyStr === newKeyByData) {
      return;
    }
    if (!this.parentEntity) return
    const { isHidden } = this.getData()
    const scene: THREE.Scene | THREE.Group = this.parentEntity.group;
    scene.remove(this.meshGroup)
    if (isHidden) {
      this.meshGroup = new THREE.Group();
    } else {
      this.meshGroup = this.create3DMesh();
    }
    scene.add(this.meshGroup)
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

  // 可以设置动画的属性(可计算差值)
  canEditAnimationDataColumn(): string[] {
    return [];
  }

  // 创建属性补间动画值
  editAnimationDataColumn(column: string, a: any, b: any, time: number): any | undefined {
    if (typeof a === 'number' && typeof b === 'number') {
      return a + (b - a) * time
    }
  }
}

export type EntityConstructor = new (world: GroupBaseEntity<GroupBaseData>, data: BaseObjData) => BaseEntityClass<any>;
