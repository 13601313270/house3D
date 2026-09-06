import * as THREE from 'three'
import { PointObjData, Point, BaseObjData, HandelInfo } from './map2d'
import { GroupBaseEntity } from '@/types/groupBase/entity'
import { BaseEntityClass } from './baseEntity'
import { GroupBaseData } from './groupBase'
import { moveIcon } from '@/utils/handleImgs'

// x/y 平面拖动面用的移动图标纹理（全实体共享，避免重复加载）
const movePlaneTexture = new THREE.TextureLoader().load('/icons/move.png')
movePlaneTexture.colorSpace = THREE.SRGBColorSpace

export abstract class PointEntityClass<T extends PointObjData> extends BaseEntityClass<T> {
  boundingBox: THREE.Group
  all3DActionHandel: THREE.Group
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
      // 创建一个方向轴箭头。base 箭头默认指向 +y（向上），通过旋转对齐到指定轴与方向。
      // moveType: 'z' -> 3D y 轴（上），'x' -> 3D x 轴，'y' -> data.y 即 3D z 轴
      const createArrow = (moveType: 'x' | 'y' | 'z', direction: 1 | -1, color: number) => {
        const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
        material.depthTest = false;
        material.depthWrite = false;
        const shaftMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), material);
        shaftMesh.layers.set(2)
        // @ts-ignore
        shaftMesh.entity = this
        // @ts-ignore
        shaftMesh.moveType = moveType;

        const arrowheadMesh = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.5, 4), material);
        arrowheadMesh.layers.set(2)
        arrowheadMesh.rotation.y = Math.PI / 4;
        arrowheadMesh.position.y = 0.7;
        // @ts-ignore
        arrowheadMesh.entity = this
        // @ts-ignore
        arrowheadMesh.moveType = moveType;

        const group = new THREE.Group()
        group.add(shaftMesh);
        group.add(arrowheadMesh);
        // @ts-ignore
        group.entity = this
        // @ts-ignore
        group.moveType = moveType;

        // 将默认 +y 方向的箭头旋转到目标轴
        if (moveType === 'x') {
          group.rotation.z = -direction * Math.PI / 2
        } else if (moveType === 'y') {
          group.rotation.x = direction * Math.PI / 2
        }
        return group
      }

      const outerGroup = new THREE.Group()
      outerGroup.visible = false
      // @ts-ignore
      outerGroup.entity = this
      // @ts-ignore
      outerGroup.moveType = 'z'

      // children[0]: z 轴箭头（向上）
      outerGroup.add(createArrow('z', 1, 0x0000ff))
      // children[1] / children[2]: x 轴两个方向
      outerGroup.add(createArrow('x', 1, 0xff0000))
      outerGroup.add(createArrow('x', -1, 0xff0000))
      // children[3] / children[4]: y 轴两个方向（data.y -> 3D z 轴）
      outerGroup.add(createArrow('y', 1, 0x00ff00))
      outerGroup.add(createArrow('y', -1, 0x00ff00))

      // children[5]: x/y 平面拖动面（水平方形），拖动可在 x/y 两轴自由移动
      const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, map: movePlaneTexture });
      planeMaterial.depthTest = false;
      planeMaterial.depthWrite = false;
      const planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), planeMaterial);
      planeMesh.layers.set(2)
      planeMesh.rotation.x = -Math.PI / 2 // 平铺到水平面（朝上）
      // @ts-ignore
      planeMesh.entity = this
      // @ts-ignore
      planeMesh.moveType = 'xy'
      outerGroup.add(planeMesh)

      this.all3DActionHandel = outerGroup;
      if (this.parentEntity) {
        this.parentEntity.group.add(outerGroup)
      }
    })();
    this.updateBoundingBoxState();
  }

  protected circleRadius_ = 8

  protected getCircleRadius(): number {
    if (!this.boundingBoxData) {
      return this.circleRadius_
    }
    let drawAngelLength: number;
    const [size] = this.boundingBoxData
    if (size.x >= size.z) {
      drawAngelLength = size.x / 2;
    } else {
      drawAngelLength = size.z / 2;
    }
    return drawAngelLength / 10;
  }

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void {
    const data = this.getData();
    const screenX = data.x * zoomLevel
    const screenY = data.y * zoomLevel
    // 控制点
    const circleRadius = this.getCircleRadius() * zoomLevel + 3;
    const imgSize = circleRadius * 1.5;
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke();
    ctx.drawImage(moveIcon, screenX - imgSize / 2, screenY - imgSize / 2, imgSize, imgSize);
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
    this.meshGroup.position.set(data.x, data.z, data.y)
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)

    const circleRadius = this.getCircleRadius();

    if (dist < circleRadius) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    return null;
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    if (matchHandelInfo.index === 0) {
      this.setData({
        x: position.x,
        y: position.y,
      } as Partial<T>)
    }
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
      if (this.all3DActionHandel) {
        this.all3DActionHandel.position.set(data.x, data.z, data.y)
        // const height = Math.max(Math.min(40, boxVector3.y), 20);
        const radio = Math.max(Math.min(boxVector3.x / 8, boxVector3.z / 8, 20), 8);
        const height = radio * 3;
        const ox = offsetVector3.x;
        const oy = offsetVector3.y;
        const oz = offsetVector3.z;
        const halfBoxX = boxVector3.x / 2;
        const halfBoxY = boxVector3.y / 2;
        const halfBoxZ = boxVector3.z / 2;

        const setArrow = (index: number, px: number, py: number, pz: number) => {
          this.all3DActionHandel!.children[index].scale.set(radio, height, radio)
          this.all3DActionHandel!.children[index].position.set(px, py, pz)
        }

        // children[0]: z 轴箭头（向上），位于盒子顶部
        setArrow(0, ox, halfBoxY + height / 2 + oy, oz)
        // children[1]: x+ 箭头，位于 +x 侧面，指向 +x
        setArrow(1, halfBoxX + height / 2 + ox, oy, oz)
        // children[2]: x- 箭头，位于 -x 侧面，指向 -x
        setArrow(2, -halfBoxX - height / 2 + ox, oy, oz)
        // children[3]: y+ 箭头（data.y -> 3D +z），位于 +z 侧面
        setArrow(3, ox, oy, halfBoxZ + height / 2 + oz)
        // children[4]: y- 箭头（data.y -> 3D -z），位于 -z 侧面
        setArrow(4, ox, oy, -halfBoxZ - height / 2 + oz)
        // children[5]: x/y 平面拖动面（水平方形），平铺在盒子底部
        const planeSide = radio * 5
        this.all3DActionHandel!.children[5].scale.set(planeSide, planeSide, 1)
        this.all3DActionHandel!.children[5].position.set(ox, oy - halfBoxY, oz)
        // this.all3DActionHandel.visible = false
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
  setPrepareState(x: number, y: number): string[] {
    this.setData({
      x,
      y,
    } as Partial<T>)
    return [];
  }

  beforeRemove() {
    super.beforeRemove()
    if (!this.parentEntity) return
    const scene: THREE.Scene | THREE.Group = this.parentEntity.group;
    if (this.boundingBox) {
      scene.remove(this.boundingBox)
    }
    if (this.all3DActionHandel) {
      scene.remove(this.all3DActionHandel)
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
