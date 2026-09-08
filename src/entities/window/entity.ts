import * as THREE from 'three'
import { Point, HandelInfo } from '@/types/map2d'
import { WindowData } from './index.d'
import { GroupBaseEntity } from '@/types/groupBase/entity';
import { editItem } from '@/utils/editItem';
import { getMaterialById } from '@/material';
import { MatchRectArea } from '@/utils/matchArea'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { allSnapFromType } from '@/types/baseEntity';
import { WallEntity } from '../wall/entity';
import { GroupBaseData } from '@/types/groupBase';
import { EntityInWallWithSubtract } from '@/types/entityInWallWithSubtract';

export class WindowEntity extends EntityInWallWithSubtract<WindowData> {
  name: string = '窗户'
  type: string = 'window'
  private circleRadius = 6

  constructor(world: GroupBaseEntity<GroupBaseData>, window: WindowData) {
    super(world, window)
    if (window && window.wallId && this.parentEntity) {
      const wall = this.parentEntity.getTypeListEntity('wall').find((entity) => {
        return entity.getData().id === window.wallId
      });
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
    const screenX = data.x * zoomLevel
    const screenY = data.y * zoomLevel

    const {
      hasBorder,
      bqc,
      tc
    } = data
    const width = data.width * zoomLevel;
    const thickness = wallThickness * zoomLevel;

    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(data.angle)

    ctx.fillStyle = hasBorder ? bqc : tc
    ctx.strokeStyle = hasBorder ? bqc : tc
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    ctx.setLineDash([5, 5])
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
    ctx.beginPath()
    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()

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
    ctx.save(); // 保存当前状态
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

  showMatchHandel(x: number, y: number) {
    let wallThickness = 10;
    const data = this.getData();
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
        angleY: data.angle * -1,
      })
    }
    return null;
  }

  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number): HandelInfo | null {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        id: data.id,
        type: this.type,
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
      // ...this.getData(),
      x,
      y,
    })
  }

  getSubtract() {
    return {
      width: this.getData().width,
      height: this.getData().height,
      depth: -1,
    }
  }

  create3DMesh(): THREE.Group {
    let wallThickness = 10;
    const data = this.getData();
    const group = new THREE.Group();
    const {
      bqc,
      tc,
      ic,
    } = data
    const baseZ = data.height / 2 + (data.bottom || 0);
    let wall: WallEntity | null = null;
    if (this.parentEntity) {
      wall = this.parentEntity.getTypeListEntity('wall').find((entity) => {
        return entity.getData().id === data.wallId;
      }) as WallEntity
      wallThickness = wall ? wall.getData().thickness : 10;
    }
    const geometry = new THREE.BoxGeometry(
      data.width * 1,
      data.height * 1,
      1
    );// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: 'white', opacity: 0.1, transparent: true })
    const windowMesh = new THREE.Mesh(geometry, material)
    windowMesh.position.setY(baseZ)
    group.add(windowMesh);

    // group添加门框
    (() => {
      if (!data.hasBorder) return
      const border = 7;
      const geometryRight = new THREE.BoxGeometry(
        border,
        data.height * 1 + border,
        wallThickness + 4
      );
      const material = getMaterialById(data.bmt)?.material(new THREE.Vector3(0, 0, 0)) || new THREE.MeshStandardMaterial({ color: bqc })
      const doorMeshRight = new THREE.Mesh(geometryRight, material)
      doorMeshRight.position.setX(data.width / 2 + border / 2 - 1)
      doorMeshRight.position.setY(baseZ)
      group.add(doorMeshRight);

      const geometryLeft = new THREE.BoxGeometry(
        border,
        data.height * 1 + border,
        wallThickness + 4
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2 - border / 2 + 1)
      doorMeshLeft.position.setY(baseZ)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + border * 2 - 2,
        border,
        wallThickness + 4
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height / 2 + border / 2 - 2 + baseZ)
      group.add(doorMeshTop);

      const geometryBottom = new THREE.BoxGeometry(
        data.width * 1 + border * 2 - 2,
        border,
        wallThickness + 4
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, material)
      doorMeshBottom.position.setY(-data.height / 2 - border / 2 + 1 + baseZ)
      group.add(doorMeshBottom);
    })();
    // 内部的框
    const innerKborder = 4;
    (() => {
      const material = getMaterialById(data.tmt)?.material(new THREE.Vector3(0, 0, 0)) || new THREE.MeshStandardMaterial({ color: tc })

      const geometryRight = new THREE.BoxGeometry(
        innerKborder,
        data.height * 1,
        5
      );
      const doorMeshRight = new THREE.Mesh(geometryRight, material)
      doorMeshRight.position.setX(data.width / 2)
      doorMeshRight.position.setY(baseZ)
      group.add(doorMeshRight);

      const geometryCenter = new THREE.BoxGeometry(
        innerKborder,
        data.height * 1,
        5
      );

      const doorMeshCenter = new THREE.Mesh(geometryCenter, material)
      doorMeshCenter.position.setX(0)
      doorMeshCenter.position.setY(baseZ)
      group.add(doorMeshCenter);

      const geometryLeft = new THREE.BoxGeometry(
        innerKborder,
        data.height * 1,
        5
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2)
      doorMeshLeft.position.setY(baseZ)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + innerKborder,
        innerKborder,
        5
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height / 2 - 1 + baseZ)
      group.add(doorMeshTop);

      const geometryBottom = new THREE.BoxGeometry(
        data.width * 1 + innerKborder,
        innerKborder,
        5
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, material)
      doorMeshBottom.position.setY(-data.height / 2 + baseZ)
      group.add(doorMeshBottom);
    })();
    const windowKWidth = 4;
    const windowMaterial = getMaterialById(data.icmt)?.material(new THREE.Vector3(0, 0, 0)) || new THREE.MeshStandardMaterial({ color: ic });
    (() => {
      const rightWindowGorup = new THREE.Group()
      // 两扇扇面

      const leftX = data.width / -2 + windowKWidth + innerKborder / 2
      const rightX = -windowKWidth / 2;
      // 右
      const geometryRight = new THREE.BoxGeometry(
        windowKWidth,
        data.height * 1 - innerKborder,
        5
      );
      const meshRight = new THREE.Mesh(geometryRight, windowMaterial)
      meshRight.position.setX(rightX)
      rightWindowGorup.add(meshRight)
      // 左
      const geometryLeft = new THREE.BoxGeometry(
        windowKWidth,
        data.height * 1 - innerKborder,
        5
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, windowMaterial)
      doorMeshLeft.position.setX(leftX)
      rightWindowGorup.add(doorMeshLeft)
      // 上
      const geometryTop = new THREE.BoxGeometry(
        rightX - leftX,
        windowKWidth,
        5
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, windowMaterial)
      doorMeshTop.position.setY(data.height / 2 - windowKWidth)
      doorMeshTop.position.setX((leftX + rightX) / 2)
      rightWindowGorup.add(doorMeshTop)
      // 下
      const geometryBottom = new THREE.BoxGeometry(
        rightX - leftX,
        windowKWidth,
        5
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, windowMaterial)
      doorMeshBottom.position.setY(-data.height / 2 + windowKWidth)
      doorMeshBottom.position.setX((leftX + rightX) / 2)
      rightWindowGorup.add(doorMeshBottom)

      // 组合起来
      rightWindowGorup.position.setX(data.width / 2 - innerKborder / 2)
      rightWindowGorup.rotation.y = THREE.MathUtils.degToRad(data.rightOpenAngle * -1 || 0)
      rightWindowGorup.position.setY(baseZ)
      group.add(rightWindowGorup);
    })();
    (() => {
      const leftWindowGorup = new THREE.Group()
      const leftX = windowKWidth / 2;// data.width / -2 + windowKWidth + innerKborder / 2
      const rightX = data.width / 2 - windowKWidth - innerKborder / 2;
      // 右
      const geometryRight = new THREE.BoxGeometry(
        windowKWidth,
        data.height * 1 - innerKborder,
        5
      );
      const doorMeshRight = new THREE.Mesh(geometryRight, windowMaterial)
      doorMeshRight.position.setX(rightX)
      leftWindowGorup.add(doorMeshRight)
      // 左
      const geometryLeft = new THREE.BoxGeometry(
        windowKWidth,
        data.height * 1 - innerKborder,
        5
      );
      const meshLeft = new THREE.Mesh(geometryLeft, windowMaterial)
      meshLeft.position.setX(leftX)
      leftWindowGorup.add(meshLeft)
      // 上
      const geometryTop = new THREE.BoxGeometry(
        rightX - leftX,
        windowKWidth,
        5
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, windowMaterial)
      doorMeshTop.position.setY(data.height / 2 - windowKWidth)
      doorMeshTop.position.setX((leftX + rightX) / 2)
      leftWindowGorup.add(doorMeshTop)
      // 下
      const geometryBottom = new THREE.BoxGeometry(
        rightX - leftX,
        windowKWidth,
        5
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, windowMaterial)
      doorMeshBottom.position.setY(-data.height / 2 + windowKWidth)
      doorMeshBottom.position.setX((leftX + rightX) / 2)
      leftWindowGorup.add(doorMeshBottom)

      // 组合起来
      leftWindowGorup.position.setX(data.width / -2 + innerKborder / 2)
      leftWindowGorup.rotation.y = THREE.MathUtils.degToRad(data.leftOpenAngle || 0)
      leftWindowGorup.position.setY(baseZ)
      group.add(leftWindowGorup);
    })();
    // group.position.set(data.x, data.height / 2 + (data.bottom || 0), data.y)
    group.rotateY(data.angle * -1);
    if (wall && data.wallPointId > -1 && wall.meshGroup.children.length) {
      this.subWall()
    }
    return group
  }

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { width, height, bottom, z, angle } = this.getData();
    const thickness = 20;
    return [
      new THREE.Vector3(width, height, thickness),
      new THREE.Vector3(0, height / 2 + (bottom || 0), 0),
      new THREE.Vector3(0, angle * -1, 0)
    ]
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

  getEditPropConfigData(data: WindowData): editItem[] {
    return [
      {
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -100,
        max: 100,
        step: 1,
        value: data.z,
      },
      {
        id: 'width',
        label: '宽度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 1,
        value: data.width,
      },
      {
        id: 'height',
        label: '高度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 1,
        value: data.height,
      },
      {
        id: 'hasBorder',
        label: '是否有包墙',
        dataType: 'boolean',
        value: data.hasBorder,
      },
      {
        id: 'bqc',
        label: '包墙颜色',
        dataType: 'color',
        value: data.bqc,
      },
      {
        id: 'bmt',
        label: '包墙材质',
        dataType: 'material',
        value: data.bmt,
      },
      {
        id: 'tc',
        label: '门框颜色',
        dataType: 'color',
        value: data.tc,
      },
      {
        id: 'tmt',
        label: '门框材质',
        dataType: 'material',
        value: data.tmt,
      },
      {
        id: 'ic',
        label: '玻璃框颜色',
        dataType: 'color',
        value: data.ic,
      },
      {
        id: 'icmt',
        label: '玻璃框材质',
        dataType: 'material',
        value: data.icmt,
      },
      {
        id: 'rightOpenAngle',
        label: '右窗打开角度',
        dataType: 'number',
        min: -180,
        max: 180,
        step: 15,
        value: data.rightOpenAngle,
      },
      {
        id: 'leftOpenAngle',
        label: '左窗打开角度',
        dataType: 'number',
        min: -180,
        max: 180,
        step: 15,
        value: data.leftOpenAngle,
      },
    ]
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow(this.getEditPropConfigData(data), (val) => {
      this.setData({
        ...val,
      })
    })
  }

  getDataMeta(): { [key: string]: string; } {
    return {
      ...super.getDataMeta(),
      width: '宽度',
      height: '高度',
      bqc: '包墙颜色',
      bmt: '包墙材质',
      tc: '门框颜色',
      tmt: '门框材质',
      ic: '玻璃框颜色',
      icmt: '玻璃框材质',
      hasBorder: '是否有门框',
      rightOpenAngle: '右窗打开角度',
      leftOpenAngle: '左窗打开角度'
    }
  }

  // 可以动画编辑的列
  canEditAnimationDataColumn() {
    return [
      ...super.canEditAnimationDataColumn(),
      'height',
      'width',
      'rightOpenAngle',
      'leftOpenAngle',
    ]
  }
}
