import * as THREE from 'three'
import { PointObjData, Point, BaseObjData } from './map2d'
import { World } from '@/utils/world/entity'
import { BaseEntityClass } from './baseEntity'

export abstract class PointEntityClass<T extends PointObjData> extends BaseEntityClass<T> {
  abstract isPointObj: boolean // 点状对象，如窗户/门。非点状的如墙
  boundingBox: THREE.Group
  moveZBox: THREE.Group
  boundingBoxData: [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null = null // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  spriteGroup: THREE.Group | null = null

  constructor(world: World, data: T) {
    super(world, data);
    (() => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const boxMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 }));
      boxMesh.visible = false
      boxMesh.layers.set(2)
      const group = new THREE.Group()

      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 1 });
      const lineBox = new THREE.LineSegments(edges, lineMaterial);
      lineBox.visible = false
      lineBox.layers.set(2)

      group.add(boxMesh);
      group.add(lineBox);

      // @ts-ignore
      boxMesh.entity = this;
      // @ts-ignore
      lineBox.entity = this
      group.visible = false
      this.boundingBox = group;
      window.worldState.scene.add(group)
    })();
    (() => {
      const shaftGeometry = new THREE.BoxGeometry(1, 1, 1);
      const shaftMesh = new THREE.Mesh(shaftGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 1 }));
      shaftMesh.layers.set(2)

      const arrowheadGeometry = new THREE.ConeGeometry(1.5, 0.7, 4);
      const arrowheadMesh = new THREE.Mesh(arrowheadGeometry, new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 1 }));
      arrowheadMesh.layers.set(2)
      arrowheadMesh.rotation.y = Math.PI / 4;
      arrowheadMesh.position.y = 0.7;

      const group = new THREE.Group()
      group.add(shaftMesh);
      // @ts-ignore
      shaftMesh.entity = this
      // @ts-ignore
      arrowheadMesh.entity = this
      group.add(arrowheadMesh);
      // @ts-ignore
      group.entity = this
      const group2 = new THREE.Group()
      group2.add(group)
      // @ts-ignore
      group2.entity = this
      this.moveZBox = group2;
      window.worldState.scene.add(group2)
    })();
  }

  // 创建包裹立方体
  abstract createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度

  reCreate3DMeshIfNeed(): void {
    const oldCacheKey = this.cacheKeyStr;
    super.reCreate3DMeshIfNeed();
    const newKeyByData = this.meshNeedChangeKey();
    if (oldCacheKey === newKeyByData) {
      return;
    }
    const scene: THREE.Scene = window.worldState.scene
    if (this.spriteGroup) {
      scene.remove(this.spriteGroup)
      this.spriteGroup = null
    }
    // 容器包裹立方体
    (() => {
      const boundingBoxData = this.createBoundingBox();
      this.boundingBoxData = boundingBoxData
      if (!boundingBoxData) {
        return;
      }
      // const [boxVector3, offsetVector3, rotateVector3] = boundingBox;
      // this.boxSize.set(boxVector3.x, boxVector3.y, boxVector3.z)
      // this.boxOffset.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)
      // this.boxRotate.set(rotateVector3.x, rotateVector3.y, rotateVector3.z);
      (() => {
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
  }

  public markObjectIsDirty() {
    // 这里注意防止死循环
    super.markObjectIsDirty()
    if (this.spriteGroup) {
      window.worldState.scene.remove(this.spriteGroup)
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

  // 当前对象进入到一根吸附线的区域
  abstract inSceneSnapLineArea(
    obj: BaseEntityClass<BaseObjData>,
    line: [Point, Point],
    point: Point,
  ): boolean;

  // 当前对象不在任何一根吸附线的区域
  notInSceneSnapLineArea(): void { }

  changePosition(newPosition: { x: number, y: number }) {
    this.data.x = newPosition.x
    this.data.y = newPosition.y
    this.world._callObjDataChange(this)
  }

  // 待添加状态（鼠标新增悬浮的时候）
  abstract setPrepareState(x: number, y: number, ...args: any[]): string[]

  beforeRemove() {
    super.beforeRemove()
    const scene: THREE.Scene = window.worldState.scene
    if (this.boundingBox) {
      scene.remove(this.boundingBox)
    }
    if (this.moveZBox) {
      scene.remove(this.moveZBox)
    }
    if (this.spriteGroup) {
      scene.remove(this.spriteGroup)
      this.spriteGroup = null
    }
  }

  inAreaHoverText() {
    return this.name
  }
}
