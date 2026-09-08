import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DoubleDoorData } from './index.d'
import { editItem } from '@/utils/editItem';
import { getMaterialById } from '@/material';
import { MatchRectArea } from '@/utils/matchArea';
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect';
import { allSnapFromType } from '@/types/baseEntity';
import { WallEntity } from '../wall/entity';
import { GroupBaseEntity } from '@/types/groupBase/entity';
import { GroupBaseData } from '@/types/groupBase';
import { EntityInWallWithSubtract } from '@/types/entityInWallWithSubtract';

export class DoubleDoorEntity extends EntityInWallWithSubtract<DoubleDoorData> {
  name: string = '对开门'
  type: string = 'doubleDoor'
  private circleRadius = 6

  constructor(world: GroupBaseEntity<GroupBaseData>, door: DoubleDoorData) {
    super(world, door)
    if (door && door.wallId && this.parentEntity) {
      const wall = this.parentEntity.getTypeListEntity('wall').find((entity) => entity.getData().id === door.wallId);
      if (wall) {
        this.associationEntity.push(wall)
        wall.associationEntity.push(this)
      }
    }
  }

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    let wallThickness = 10;
    if (this.parentEntity) {
      const findWall: WallEntity = this.parentEntity.getTypeListEntity('wall').find((entity) => entity.getData().id === data.wallId) as WallEntity
      if (findWall) {
        wallThickness = findWall.getData().thickness;
      }
    }
    const screenX = data.x * zoomLevel;
    const screenY = data.y * zoomLevel;
    const color = data.color
    const width = data.width * zoomLevel;
    const thickness = wallThickness * zoomLevel;
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(data.angle)
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    // 门洞矩形（整宽）
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    // 左扇门开启弧线（向左凸）
    ctx.beginPath()
    ctx.arc(0, 0, width / 2, Math.PI * 3 / 4, Math.PI * 5 / 4)
    ctx.stroke()
    // 右扇门开启弧线（向右凸）
    ctx.beginPath()
    ctx.arc(0, 0, width / 2, -Math.PI / 4, Math.PI / 4)
    ctx.stroke()
    // 中缝竖线
    ctx.beginPath()
    ctx.moveTo(0, -thickness / 2)
    ctx.lineTo(0, thickness / 2)
    ctx.stroke()
    ctx.restore()
  }

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void {
    const data = this.getData();
    let wallThickness = 10;
    if (this.parentEntity) {
      const findWall: WallEntity = this.parentEntity.getTypeListEntity('wall').find((entity) => entity.getData().id === data.wallId) as WallEntity
      if (findWall) {
        wallThickness = findWall.getData().thickness;
      }
    }
    const screenX = data.x * zoomLevel
    const screenY = data.y * zoomLevel
    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.closePath();

    // 绘制 轮廓
    const matchArea = new MatchRectArea({
      x: data.x,
      y: data.y,
      width: data.width,
      depth: Math.max(wallThickness + 20, 20),
      angleY: data.angle * -1,
    })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'red'
    ctx.save();
    // 保存当前状态
    ctx.translate(
      matchArea.data.x * zoomLevel,
      matchArea.data.y * zoomLevel
    ); // 移动原点到目标中心
    ctx.rotate(matchArea.data.angleY * -1); // 围绕新原点旋转
    // 绘制一个方块
    ctx.strokeRect(
      matchArea.data.width / -2 * zoomLevel,
      matchArea.data.depth / -2 * zoomLevel,
      matchArea.data.width * zoomLevel,
      matchArea.data.depth * zoomLevel,
    )
    ctx.restore(); // 恢复原始状态
  }

  // 左扇门 glb
  leftGlbObj: THREE.Group | null = null;
  // 右扇门 glb
  rightGlbObj: THREE.Group | null = null;

  getSubtract() {
    return {
      width: this.getData().width,
      height: this.getData().height,
      depth: -1,
    }
  }

  create3DMesh(): THREE.Group {
    const data = this.getData();
    const group = new THREE.Group()
    let wallThickness = 10;
    let wall: WallEntity | null = null;
    if (this.parentEntity) {
      wall = this.parentEntity.getTypeListEntity('wall').find((entity) => {
        return entity.getData().id === data.wallId
      }) as WallEntity
      wallThickness = wall ? wall.getData().thickness : 10;
    }
    // 每扇门的宽度（总宽的一半）
    const panelWidth = data.width / 2;
    const changeBLBState = () => {
      if (this.leftGlbObj) {
        this.leftGlbObj.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.material = material
          }
        })
        // 左扇：铰链在左边缘，门扇向中心延伸
        if (data.openType === 1) {
          // 内开
          this.leftGlbObj.position.set(data.width / -2.1, data.height / -2, wallThickness / 2);
          this.leftGlbObj.scale.set(panelWidth * 0.23, data.height * 0.11, wallThickness * 2);
          this.leftGlbObj.rotation.y = THREE.MathUtils.degToRad(data.leftOpenAngle * -1 || 0);
        }
        else if (data.openType === 2) {
          // 外开
          this.leftGlbObj.position.set(data.width / -2.1, data.height / -2, wallThickness / -2);
          this.leftGlbObj.scale.set(panelWidth * 0.23, data.height * 0.11, wallThickness * -2);
          this.leftGlbObj.rotation.y = THREE.MathUtils.degToRad(data.leftOpenAngle || 0);
        }
      }
      if (this.rightGlbObj) {
        this.rightGlbObj.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.material = material
          }
        })
        // 右扇：铰链在右边缘，门扇向中心延伸（镜像）
        if (data.openType === 1) {
          // 内开
          this.rightGlbObj.position.set(data.width / 2.1, data.height / -2, wallThickness / 2);
          this.rightGlbObj.scale.set(panelWidth * -0.23, data.height * 0.11, wallThickness * 2);
          this.rightGlbObj.rotation.y = THREE.MathUtils.degToRad(data.rightOpenAngle || 0);
        }
        else if (data.openType === 2) {
          // 外开
          this.rightGlbObj.position.set(data.width / 2.1, data.height / -2, wallThickness / -2);
          this.rightGlbObj.scale.set(panelWidth * -0.23, data.height * 0.11, wallThickness * -2);
          this.rightGlbObj.rotation.y = THREE.MathUtils.degToRad(data.rightOpenAngle * -1 || 0);
        }
      }
    }
    if (this.leftGlbObj === null && this.rightGlbObj === null) {
      const loader = new GLTFLoader();
      loader.load('https://video-obj.oss-cn-beijing.aliyuncs.com/door.glb', (gltf: any) => {
        const leftScene = gltf.scene;
        // 克隆一份作为右扇门（共享几何与材质）
        const rightScene = gltf.scene.clone(true);
        this.leftGlbObj = leftScene;
        this.rightGlbObj = rightScene;
        changeBLBState()
        leftScene.position.setY(0)
        rightScene.position.setY(0)
        group.add(leftScene)
        group.add(rightScene)
      });
    }
    const material = data.mt ? (getMaterialById(data.mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color: data.color }));

    // group添加门框
    (() => {
      if (!data.hasBorder) return
      const border = 7;
      const borderMaterial = data.mt ? (getMaterialById(data.mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color: data.color }));

      // 右侧竖框
      const geometryRight = new THREE.BoxGeometry(
        border,
        data.height * 1,
        wallThickness + 4
      );
      const doorMeshRight = new THREE.Mesh(geometryRight, borderMaterial)
      doorMeshRight.position.setX(data.width / 2)
      doorMeshRight.position.setY(data.height / 2)
      group.add(doorMeshRight);

      // 左侧竖框
      const geometryLeft = new THREE.BoxGeometry(
        border,
        data.height * 1,
        wallThickness + 4
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, borderMaterial)
      doorMeshLeft.position.setX(-data.width / 2)
      doorMeshLeft.position.setY(data.height / 2)
      group.add(doorMeshLeft);

      // 顶部横框
      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + border,
        border,
        wallThickness + 4
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, borderMaterial)
      doorMeshTop.position.setY(data.height)
      group.add(doorMeshTop);
    })();
    if (this.leftGlbObj && this.rightGlbObj) {
      changeBLBState()
      this.leftGlbObj.position.setY(0)
      this.rightGlbObj.position.setY(0)
      group.add(this.leftGlbObj)
      group.add(this.rightGlbObj)
    }

    // group.position.set(data.x, data.height / 2, data.y)
    group.rotateY(data.angle * -1);
    if (wall && data.wallPointId > -1 && wall.meshGroup.children[data.wallPointId]) {
      this.subWall()
    }
    return group
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { width, height, bottom, angle } = this.getData();
    const thickness = 20;
    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    return [
      new THREE.Vector3(width, height, thickness + 10),
      new THREE.Vector3(0, height / 2 + (bottom || 0), 0),
      new THREE.Vector3(0, angle * -1, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    let wallThickness = 10;
    if (this.parentEntity) {
      const wall: WallEntity = this.parentEntity.getTypeListEntity('wall').find((entity) => {
        return entity.getData().id === data.wallId;
      }) as WallEntity
      wallThickness = wall ? wall.getData().thickness : 10;
    }
    if (isPointInRotatedRect(x, y, {
      x: data.x,
      y: data.y,
      width: data.width,
      depth: Math.max(wallThickness + 20, 20),
      angleY: data.angle * -1,
    })) {
      return new MatchRectArea({
        x: data.x,
        y: data.y,
        width: data.width,
        depth: Math.max(wallThickness + 20, 20),
        angleY: data.angle * -1
      })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius + 3) {
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
  }) {
    const { x, y } = position
    this.setData({
      x,
      y,
    })
  }

  getMineBeSnapPoints() {
    const key: allSnapFromType = 'point';
    const data = this.getData();
    return [{
      objType: this.type,
      snapFromType: key,
      point: {
        index: 0,
        x: data.x,
        y: data.y,
      },
    }]
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  getEditPropConfigData(data: DoubleDoorData): editItem[] {
    return [
      {
        id: 'width',
        label: '宽度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.width,
      },
      {
        id: 'height',
        label: '高度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 10,
        value: data.height,
      },
      {
        id: 'mt',
        label: '门材质',
        dataType: 'material',
        value: data.mt,
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color,
      },
      {
        id: 'hasBorder',
        label: '是否有门框',
        dataType: 'boolean',
        value: data.hasBorder,
      },
      {
        id: 'leftOpenAngle',
        label: '左门打开角度',
        dataType: 'number',
        min: 0,
        max: 180,
        step: 15,
        value: data.leftOpenAngle,
      },
      {
        id: 'rightOpenAngle',
        label: '右门打开角度',
        dataType: 'number',
        min: 0,
        max: 180,
        step: 15,
        value: data.rightOpenAngle,
      },
      {
        id: 'openType',
        label: '开门方式',
        dataType: 'enum',
        enumList: [
          {
            name: '内开',
            id: 1,
            img: '/toolType/doubleDoorInner.png',
          },
          {
            name: '外开',
            id: 2,
            img: '/toolType/doubleDoorOut.png',
          },
        ],
        value: data.openType,
      },
      {
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -300,
        max: 300,
        step: 1,
        value: data.z,
      }
    ]
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow(this.getEditPropConfigData(data), (val) => {
      this.setData({
        ...val,
      })
      this.reBuildWall()
    })
  }

  getDataMeta(): { [key: string]: string; } {
    return {
      ...super.getDataMeta(),
      width: '宽度',
      height: '高度',
      color: '颜色',
      mt: '材质', // 门材质
      hasBorder: '是否有门框', // 是否有门框
      openType: '开门方式', // 开门方式 1内开 2外开
      leftOpenAngle: '左门打开角度',// 左扇门打开的角度
      rightOpenAngle: '右门打开角度',// 右扇门打开的角度
    }
  }

  // 可以动画编辑的列
  canEditAnimationDataColumn(): string[] {
    return [
      ...super.canEditAnimationDataColumn(),
      'width',
      'height',
      'leftOpenAngle',
      'rightOpenAngle',
    ];
  }
}
