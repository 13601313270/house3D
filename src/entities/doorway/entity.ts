import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { DoorData } from './index.d'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { EntityClassInWall } from '@/types/entityInWall'
import { editItem } from '@/utils/editItem';
import { getMaterialById } from '@/material';
import { MatchRectArea } from '@/utils/matchArea';
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect';
import { allSnapFromType } from '@/types/baseEntity';
import { WallEntity } from '../wall/entity';
import { GroupBaseEntity } from '@/types/groupBase/entity';
import { GroupBaseData } from '@/types/groupBase';

export class DoorEntity extends EntityClassInWall<DoorData> {
  name: string = '门洞'
  type: string = 'doorway'
  private circleRadius = 6

  constructor(world: GroupBaseEntity<GroupBaseData>, door: DoorData) {
    super(world, door)
    if (door && door.wallId && this.parentEntity) {
      const wall = this.parentEntity.getTypeListEntity('wall').find((entity) => entity.getData().id === door.wallId);
      if (wall) {
        this.associationEntity.push(wall)
        wall.associationEntity.push(this)
      }
    }
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: DoorData, panOffset: Point, zoomLevel: number): void {
    let wallThickness = 10;
    if (this.parentEntity) {
      const findWall: WallEntity = this.parentEntity.getTypeListEntity('wall').find((entity) => entity.getData().id === data.wallId) as WallEntity
      if (findWall) {
        wallThickness = findWall.getData().thickness;
      }
    }
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    // const wallThickness = 10; // walls.find((wall) => wall.id === this.wallId)?.thickness || 0;
    const color = data.color
    const width = data.width * zoomLevel;
    const thickness = wallThickness * zoomLevel;
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(data.angle)
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    ctx.stroke()
    ctx.restore()
  }

  draw2DHandleByData(
    ctx: CanvasRenderingContext2D,
    data: DoorData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    // console.log('zoomLevel---1', zoomLevel)
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制轮廓
    let wallThickness = 10;
    if (this.parentEntity) {
      const wall: WallEntity = this.parentEntity.getTypeListEntity('wall').find((entity) => {
        return entity.getData().id === data.wallId;
      }) as WallEntity
      wallThickness = wall ? wall.getData().thickness : 10;
    }
    const matchArea = new MatchRectArea({ x: data.x, y: data.y, width: data.width, depth: Math.max(wallThickness + 20, 20), angleY: data.angle * -1 })
    ctx.lineWidth = 2
    ctx.strokeStyle = 'red'
    ctx.save(); // 保存当前状态
    ctx.translate(
      matchArea.data.x * zoomLevel + panOffset.x,
      matchArea.data.y * zoomLevel + panOffset.y
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

  create3DMesh() {
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

    // group添加门框
    (() => {
      if (!data.hasBorder) return
      const border = 7;
      const geometryRight = new THREE.BoxGeometry(
        border,
        data.height * 1,
        wallThickness + 4
      );
      const material = data.mt ? (getMaterialById(data.mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color: data.color }));
      const doorMeshRight = new THREE.Mesh(geometryRight, material)
      doorMeshRight.position.setX(data.width / 2)
      doorMeshRight.position.setY(data.height / 2)
      group.add(doorMeshRight);

      const geometryLeft = new THREE.BoxGeometry(
        border,
        data.height * 1,
        wallThickness + 4
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2)
      doorMeshLeft.position.setY(data.height / 2)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + border,
        border,
        wallThickness + 4
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height)
      group.add(doorMeshTop);
    })();

    // group.position.set(data.x, data.height / 2, data.y)
    group.rotateY(data.angle * -1);
    if (wall && data.wallPointId > -1 && wall.meshList[data.wallPointId]) {
      const boxLength = wall.meshList.filter(v => 'isWall' in v).length;
      const countPerPoint = wall.getData().points.length === 2 ? 1 : ((boxLength - 1) / (wall.getData().points.length - 2))
      // console.log('wall.getData()-countPerPoint', countPerPoint);
      const wallGroup = wall.meshList[data.wallPointId * countPerPoint];
      const subtractGeometry = new THREE.BoxGeometry(
        data.width,
        data.height,
        wallThickness + 10
      );
      subtractGeometry.rotateY(data.angle * -1);
      // subtractGeometry.position.set(data.x, data.height / 2 - 1, data.y)
      const cylinderBrush = new Brush(subtractGeometry);
      cylinderBrush.position.set(data.x, data.height / 2 + data.z, data.y)
      cylinderBrush.updateMatrixWorld()
      const firstMesh = wallGroup.children.find(child => child instanceof THREE.Mesh) as THREE.Mesh;
      const boxBrush = new Brush(firstMesh.geometry.clone());// 主体
      boxBrush.position.set(
        wallGroup.position.x,
        wallGroup.position.y,
        wallGroup.position.z
      )
      // 3. 执行布尔运算 (立方体减去圆柱体)
      const evaluator = new Evaluator();
      // 注意：这里 SUBTRACTION 的顺序很重要：主体减去洞模型
      const resultGeometry = evaluator.evaluate(boxBrush, cylinderBrush, SUBTRACTION);
      if (firstMesh) {
        firstMesh.geometry = resultGeometry.geometry
      }
      return [
        group,
      ]
    } else {
      return [
        group
      ]
    }
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { width, height, bottom, z, angle } = this.getData();
    const thickness = 20;
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
      angleY: data.angle,
    })) {
      return new MatchRectArea({ x: data.x, y: data.y, width: data.width, depth: Math.max(wallThickness + 20, 20), angleY: data.angle * -1 })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    // console.log('zoomLevel---2', zoomLevel)
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
    this.changePosition({ x, y })
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

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow([
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
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -300,
        max: 300,
        step: 1,
        value: data.z,
      }
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }
}
