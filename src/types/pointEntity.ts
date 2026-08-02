import * as THREE from 'three'
import { PointObjData, Point, BaseObjData } from './map2d'
import { GroupBaseEntity } from '@/types/groupBase/entity'
import { BaseEntityClass } from './baseEntity'
import { GroupBaseData } from './groupBase'

export abstract class PointEntityClass<T extends PointObjData> extends BaseEntityClass<T> {
  boundingBox: THREE.Group
  moveZBox: THREE.Group
  spriteGroup: THREE.Group | null = null

  constructor(world: GroupBaseEntity<GroupBaseData> | null, data: T) {
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
      if (this.parentEntity) {
        this.parentEntity.group.add(group)
      }
    })();
    (() => {
      const shaftGeometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 1 });
      const shaftMesh = new THREE.Mesh(shaftGeometry, material);
      shaftMesh.layers.set(2)
      material.depthTest = false;
      material.depthWrite = false;
      const arrowheadGeometry = new THREE.ConeGeometry(1.5, 0.7, 4);
      const arrowheadMesh = new THREE.Mesh(arrowheadGeometry, material);
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
      group2.visible = false
      group2.add(group)
      // @ts-ignore
      group2.entity = this
      this.moveZBox = group2;
      if (this.parentEntity) {
        this.parentEntity.group.add(group2)
      }
    })();
    this.updateBoundingBoxState();
  }

  // 获取包裹立方体的数据
  abstract getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] | null // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度

  reCreate3DMeshAnd2DPreviewIfNeed(): void {
    const data = this.getData();
    const oldCacheKey = this.cacheKeyStr;
    super.reCreate3DMeshAnd2DPreviewIfNeed();
    const newKeyByData = this.create3DUnionKey();
    if (oldCacheKey === newKeyByData) {
      return;
    }
    if (!this.parentEntity) return
    const scene: THREE.Scene | THREE.Group = this.parentEntity.group;
    if (this.spriteGroup) {
      scene.remove(this.spriteGroup)
      this.spriteGroup = null
    }
    // 容器包裹立方体
    (() => {
      if (this.boundingBoxData && data.tip) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // 设置canvas尺寸
        const fontSize = data.tipFontSize || 96;
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(data.tip).width;
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
        ctx.fillText(data.tip, canvas.width / 2, canvas.height / 2 + heightPadding);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);

        const height = fontSize / 4;
        const width = height / (canvas.height / canvas.width)

        sprite.scale.set(width, height, 1);
        const group = new THREE.Group()
        group.add(sprite)
        this.spriteGroup = group
        scene.add(group)
      }
    })();
  }

  public markObjectIsDirty() {
    // 这里注意防止死循环
    super.markObjectIsDirty()
    if (this.spriteGroup && this.parentEntity) {
      this.parentEntity.group.remove(this.spriteGroup)
      this.spriteGroup = null
    }
  }

  // 当前对象是否需要重新生成3D模型状态
  create3DUnionKey(): string {
    const cacheData = {
      ...this.getData(),
      x: undefined,
      y: undefined,
      z: undefined,
    }
    return JSON.stringify(cacheData)
  }

  // 改变3D模型的状态
  // 例如：改变位置，旋转角度等
  change3DMeshState(): void {
    const data = this.getData();
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
    })
  }

  private updateBoundingBoxState() {
    const boxData = this.boundingBoxData;
    if (boxData && this.boundingBox) {
      const data = this.getData();
      // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
      const [boxVector3, offsetVector3, rotateVector3] = boxData;
      this.boundingBox.position.set(data.x, data.z, data.y)
      this.boundingBox.children[0].rotation.set(rotateVector3.x, rotateVector3.y, rotateVector3.z)
      this.boundingBox.children[0].scale.set(boxVector3.x, boxVector3.y, boxVector3.z)
      this.boundingBox.children[0].position.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)

      this.boundingBox.children[1].rotation.set(rotateVector3.x, rotateVector3.y, rotateVector3.z)
      this.boundingBox.children[1].scale.set(boxVector3.x, boxVector3.y, boxVector3.z)
      this.boundingBox.children[1].position.set(offsetVector3.x, offsetVector3.y, offsetVector3.z)

      // this.boundingBox.visible = true
      if (this.spriteGroup) {
        this.spriteGroup.position.set(data.x, data.z, data.y)
        this.spriteGroup.children[0].position.set(0, boxVector3.y / 2 + offsetVector3.y + 12, 0)
      }
      if (this.moveZBox) {
        this.moveZBox.position.set(data.x, data.z, data.y)
        // const height = Math.max(Math.min(40, boxVector3.y), 20);
        const radio = Math.max(Math.min(boxVector3.x / 8, boxVector3.z / 8, 20), 8);
        const height = radio * 3;
        this.moveZBox.children[0].scale.set(
          radio,
          height,
          radio
        )
        this.moveZBox.children[0].position.set(offsetVector3.x, boxVector3.y / 2 + height / 2 + offsetVector3.y, offsetVector3.z)
        // this.moveZBox.visible = false
      }
    } else {
      // this.boundingBox.visible = false
    }
  }

  reBuildBoundingBoxData() {
    super.reBuildBoundingBoxData()
    this.updateBoundingBoxState()
  }

  setData(data: Partial<T>) {
    super.setData(data)
    this.updateBoundingBoxState();
  }

  // 当前对象进入到一根吸附线的区域
  abstract inSceneSnapLineArea(
    obj: BaseEntityClass<BaseObjData>,
    line: [Point, Point],
    point: Point,
  ): boolean;

  // 当前对象不在任何一根吸附线的区域
  notInSceneSnapLineArea(): void { }

  // 待添加状态（鼠标新增悬浮的时候）
  abstract setPrepareState(x: number, y: number): string[]

  beforeRemove() {
    super.beforeRemove()
    if (!this.parentEntity) return
    const scene: THREE.Scene | THREE.Group = this.parentEntity.group;
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
