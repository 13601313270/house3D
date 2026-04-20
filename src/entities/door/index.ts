import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { Door } from './index.d'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { WallEntity } from '../wall'
import { editItem } from '..';
import { World } from '@/utils/world';

export function createDoorData() {
  const door: Door = {
    id: Date.now().toString(),
    wallPointId: -1,
    x: 0,
    y: 0,
    z: 0,
    width: 110,
    height: 180,
    angle: 0,
    color: '#e67e22',
  }
  return door
}

export function editPropConfig(): editItem[] {
  return [
    {
      id: 'width',
      label: '宽度',
      dataType: 'number',
    },
    {
      id: 'height',
      label: '高度',
      dataType: 'number',
    },
    {
      id: 'color',
      label: '颜色',
      dataType: 'color',
    },
  ]
}

export class DoorEntity extends EntityClass<Door> {
  type: EntityType = 'door'
  id: string
  // wallId: string | undefined
  isPointObj: boolean = true

  constructor(world: World, door: Door) {
    super(world, door)
    // this.wallId = door.wallId
    this.id = door.id
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    wallThickness: number,
    zoomLevel: number
  ): void {
    // 实现门的2D绘制逻辑
    const screenX = this.data.x * zoomLevel + panOffset.x
    const screenY = this.data.y * zoomLevel + panOffset.y
    // const wallThickness = 10; // walls.find((wall) => wall.id === this.wallId)?.thickness || 0;
    const color = this.data.color
    const width = this.data.width * zoomLevel;
    const thickness = wallThickness * zoomLevel;
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(this.data.angle)
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    ctx.beginPath()
    ctx.arc(0, 0, width / 2, -Math.PI / 4, Math.PI / 4)
    ctx.stroke()
    ctx.restore()

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  create3DMesh(wall: WallEntity) {
    const wallThickness = wall.data.thickness;
    const geometry = new THREE.BoxGeometry(
      this.data.width * 1,
      this.data.height * 1,
      1
    );// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: this.data.color })
    const doorMesh = new THREE.Mesh(geometry, material)
    // wall.remove3DCache()
    // wall.draw3DAndCache(scene)
    if (this.data.wallPointId > -1 && wall.meshList[this.data.wallPointId]) {
      const wallMesh = wall.meshList[this.data.wallPointId];
      const subtractGeometry = new THREE.BoxGeometry(
        this.data.width,
        this.data.height,
        wallThickness + 10
      );
      subtractGeometry.rotateY(this.data.angle * -1);
      const cylinderBrush = new Brush(subtractGeometry);
      cylinderBrush.position.set(this.data.x, this.data.height / 2 - 1, this.data.y)
      cylinderBrush.updateMatrixWorld()
      const boxBrush = new Brush(wallMesh.geometry.clone());// 主体
      boxBrush.position.set(
        wallMesh.position.x,
        wallMesh.position.y,
        wallMesh.position.z
      )
      // 3. 执行布尔运算 (立方体减去圆柱体)
      const evaluator = new Evaluator();
      // 注意：这里 SUBTRACTION 的顺序很重要：主体减去洞模型
      const resultGeometry = evaluator.evaluate(boxBrush, cylinderBrush, SUBTRACTION);

      wallMesh.geometry = resultGeometry.geometry
      // // 4. 创建最终的网格
      // const material = new THREE.MeshStandardMaterial({ color: 0x00aaff, side: THREE.DoubleSide });
      // const resultMesh = new THREE.Mesh(resultGeometry.geometry, material);

      // resultMesh.position.set(wallMesh.position.x, wallMesh.position.y, wallMesh.position.z + 3)
      // resultMesh.rotateY(this.angle * -1);
      doorMesh.position.set(this.data.x, this.data.height / 2, this.data.y)
      doorMesh.rotateY(this.data.angle * -1);
      return [
        doorMesh,
      ]
    } else {
      doorMesh.position.set(this.data.x, this.data.height / 2, this.data.y)
      doorMesh.rotateY(this.data.angle * -1);
      return [
        doorMesh
      ]
    }
  }

  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < 6 * zoomLevel) {
      return {
        index: 0,
        type: this.type,
        id: this.data.id,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
    this.changePosition({ x, y })
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    if (newPosition.objType === 'wall' && newPosition.snapFromType === 'line') {
      this.changePosition(newPosition.point)
      return true
    }
    return false
  }

  getMineBeSnapPoints() {
    const key: allSnapFromType = 'point';
    return [{
      objType: this.type,
      objId: this.data.id,
      snapFromType: key,
      point: {
        index: 0,
        x: this.data.x,
        y: this.data.y,
      },
    }]
  }

  getMineBeSnapLines(): [Point, Point][] {
    return []
  }

  afterBeSnapByLine(obj: EntityClass<Door>, line: [Point, Point]) {
    if (obj.type === 'wall') {
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

      const allLineKey = obj.getMineBeSnapLines().map(v => [v[0].x, v[0].y, v[1].x, v[1].y].join(','))
      const lineKey = [p1.x, p1.y, p2.x, p2.y].join(',')
      const index = allLineKey.indexOf(lineKey)
      this.data.angle = nearestAngle
      this.data.wallId = obj.data.id
      this.data.wallPointId = index
      // 双向去除原有的关联对象
      this.associationEntity.forEach(entity => {
        if (entity.associationEntity.includes(this)) {
          entity.associationEntity.splice(entity.associationEntity.indexOf(this), 1)
          entity.remove3DCache()
        }
      })
      this.associationEntity = []
      // 双向添加新的关联对象
      if (!this.associationEntity.includes(obj)) {
        this.associationEntity.push(obj)
      }
      if (!obj.associationEntity.includes(this)) {
        obj.associationEntity.push(this)
      }
      this.remove3DCache()
      this.world.draw3D()
    }
  }
}
