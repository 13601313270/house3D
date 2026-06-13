import { LineObjData } from './map2d'
import { World } from '@/utils/world'
import { BaseEntityClass } from './baseEntity'

export abstract class LineEntityClass<V, T extends LineObjData<V>> extends BaseEntityClass<T> {
  constructor(world: World, data: T) {
    console.log(1)
    super(world, data);
  }

  reCreate3DMeshIfNeed(): void {
    super.reCreate3DMeshIfNeed();
    const newKeyByData = this.meshNeedChangeKey();
    if (this.cacheKeyStr === newKeyByData) {
      return;
    }
  }

  public remove3DCache() {
    // 这里注意防止死循环
    super.remove3DCache()
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
  }

  // 当前对象不在任何一根吸附线的区域
  notInSceneSnapLineArea(): void { }

  // 待添加状态（鼠标新增悬浮的时候）
  abstract setPrepareState(x: number, y: number, ...args: any[]): void

  beforeRemove() {
    super.beforeRemove()
  }

  inAreaHoverText() {
    return this.name
  }
}
