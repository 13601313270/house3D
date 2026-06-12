import * as THREE from 'three'
import { PointObjData, HandelInfo, Point, PointWithIndex } from './map2d'
import { World } from '@/utils/world'
import { MatchRectArea, MatchCircleArea } from '@/utils/matchArea'
import { BaseEntityClass } from './baseEntity'

export type allSnapFromType = 'point' | 'line' | 'axis'
// 磁吸点
export type OrigionSnapPoint = {
  objType: string, // 磁吸点对象类型
  snapFromType: 'point', // 磁吸点来源类型
  // objId: string, // 磁吸点对象ID
  point: PointWithIndex,
}
// 磁吸点(扩展)，通过其他计算延伸出来的磁吸，比如贴边，贴发现
export type MatchSnapPoint = OrigionSnapPoint | {
  objType: string, // 磁吸点对象类型
  // objId: string, // 磁吸点对象ID
  snapFromType: 'line' | 'axis' | string, // 磁吸点来源类型
  point: Point,
}

export abstract class PointEntityClass<T extends PointObjData> extends BaseEntityClass<T> {
  abstract isPointObj: boolean // 点状对象，如窗户/门。非点状的如墙
  boundingBox: THREE.Group
  boundingBoxData: [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null = null // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  spriteGroup: THREE.Group | null = null

  constructor(world: World, data: T) {
    super(world, data);
    (() => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 1 });
      const box = new THREE.LineSegments(edges, lineMaterial);
      const group = new THREE.Group()
      group.add(box);
      // @ts-ignore
      box.entity = this;
      this.boundingBox = group;
      this.world.scene.add(group)
    })();
  }

  // public boxSize: THREE.Vector3 = new THREE.Vector3()
  // public boxOffset: THREE.Vector3 = new THREE.Vector3()
  // public boxRotate: THREE.Vector3 = new THREE.Vector3()

  // 创建包裹立方体
  abstract createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度

  reCreate3DMeshIfNeed(): void {
    const newKeyByData = this.meshNeedChangeKey();
    if (this.cacheKeyStr !== newKeyByData) {
      console.log('reCreate3DMeshIfNeed', this.cacheKeyStr, newKeyByData)
      const scene: THREE.Scene = this.world.scene
      this.meshList.forEach(mesh => scene.remove(mesh))
      if (this.spriteGroup) {
        scene.remove(this.spriteGroup)
        this.spriteGroup = null
      }
      this.meshList = this.create3DMesh(scene);
      // 容器包裹立方体
      (() => {
        const boundingBox = this.createBoundingBox();
        this.boundingBoxData = boundingBox
        if (!boundingBox) {
          return;
        }
        // const [boxVector3, offsetVector3, rotateVector3] = boundingBox;
        // this.boxSize.set(boxVector3.x, boxVector3.y, boxVector3.z)
        // this.boxOffset.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)
        // this.boxRotate.set(rotateVector3.x, rotateVector3.y, rotateVector3.z);
        (() => {
          console.log('createBoundingBox-data', this.data);
          // this.data.tip = '哈哈哈'
          if (this.data.tip) { // data.tip
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            // 设置canvas尺寸
            const fontSize = this.data.tipFontSize || 96;
            ctx.font = `bold ${fontSize}px Arial`;
            const textWidth = ctx.measureText(this.data.tip).width;
            const heightPadding = 5;
            canvas.width = textWidth + 20;  // 文字宽度 + 边距
            canvas.height = fontSize + heightPadding * 2;  // 字体高度 + 边距

            // 绘制背景和文字
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#000000ff';
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.data.tip, canvas.width / 2, canvas.height / 2 + heightPadding);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            // const width = Math.max(boxVector3.x, boxVector3.y);

            const height = fontSize / 4;
            const width = height / (canvas.height / canvas.width)

            // console.log('ccc-4', boxVector3, width, height);
            sprite.scale.set(width, height, 1);
            // sprite.position.set(0, boxVector3.y + height / 2, 0);
            // this.meshList[0].add(sprite);
            const group = new THREE.Group()
            group.add(sprite)
            this.spriteGroup = group
            scene.add(group)
          }
        })();
      })();
      this.meshList.forEach(mesh => scene.add(mesh))
      this.cacheKeyStr = newKeyByData
    }
  }

  public remove3DCache() {
    // 这里注意防止死循环
    super.remove3DCache()
    if (this.spriteGroup) {
      this.world.scene.remove(this.spriteGroup)
      this.spriteGroup = null
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
  abstract matchHandelMoveCallback(position: {
    x: number,
    y: number,
    startX?: number,
    startY?: number,
  }, matchHandelInfo: HandelInfo): void;

  // 本对象进入一个吸附对象的区域
  abstract inSceneSnapPointArea(
    newPosition: MatchSnapPoint,
    dragHandelInfo: HandelInfo,
  ): boolean;

  // 当前对象进入到一根吸附线的区域
  abstract inSceneSnapLineArea(
    obj: PointEntityClass<PointObjData>,
    line: [Point, Point],
    point: Point,
  ): boolean;

  // 当前对象不在任何一根吸附线的区域
  notInSceneSnapLineArea(): void { }

  // 本对象可以被其他对象对齐参考点（注意是被对齐，提供个其他拖动磁吸的参考点）
  abstract getMineBeSnapPoints(): Array<OrigionSnapPoint>;

  // 本对象可以被其他对象对齐的参考线（注意是被对齐，提供个其他拖动磁吸的参考线）
  abstract getMineBeSnapLines(): Array<[Point, Point]>;

  changePosition(newPosition: { x: number, y: number }) {
    this.data.x = newPosition.x
    this.data.y = newPosition.y
    this.world._callAllOnChangeCallback()
  }

  // 待添加状态（鼠标新增悬浮的时候）
  abstract setPrepareState(x: number, y: number, ...args: any[]): void

  beforeRemove() {
    super.beforeRemove()
    const scene: THREE.Scene = this.world.scene
    if (this.boundingBox) {
      scene.remove(this.boundingBox)
    }
    if (this.spriteGroup) {
      scene.remove(this.spriteGroup)
      this.spriteGroup = null
    }
  }

  draw2DPreview(ctx: CanvasRenderingContext2D, panOffset: Point, zoomLevel: number) {
    const data = this.getData();
    this.draw2DPreviewByData(ctx, data, panOffset, zoomLevel)
  }

  inAreaHoverText() {
    return this.name
  }
}
