import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { Door } from './index.d'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { Wall } from '../wall/index.d'
import { WallEntity } from '../wall'

export class DoorEntity extends EntityClass<Door> {
  type: EntityType = 'door'
  id: string
  wallId: string | undefined
  wallPointId: number
  width: number
  height: number
  angle: number

  constructor(door: Door) {
    super(door)
    this.wallId = door.wallId
    this.wallPointId = door.wallPointId
    this.angle = door.angle
    this.width = door.width
    this.height = door.height
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
    const color = '#e67e22'
    const width = this.width * zoomLevel;
    const thickness = wallThickness * zoomLevel;
    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(this.angle)
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

  draw3D(wall: WallEntity) {
    // 实现门的3D绘制逻辑
    const wallThickness = wall.data.thickness;
    // console.log('doorPointId-get', wall, wall.points)
    const geometry = new THREE.BoxGeometry(
      this.width * 1,
      this.height * 1,
      wallThickness + 10
    );// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: 0xe67e22 })
    const doorMesh = new THREE.Mesh(geometry, material)
    if (this.data.wallPointId > -1 && wall.meshList[this.data.wallPointId]) {
      const wallMesh = wall.meshList[this.data.wallPointId];
      const cylinderBrush = new Brush(geometry);
      cylinderBrush.position.set(this.data.x, this.height / 2 - 1, this.data.y)
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
      doorMesh.position.set(this.data.x, this.height / 2, this.data.y)
      // doorMesh缩放到90%
      doorMesh.scale.set(0.9, 0.9, 0.9)
      doorMesh.rotateY(this.angle * -1);
      return [
        doorMesh,
        // resultMesh
      ]
    } else {
      doorMesh.position.set(this.data.x, this.height / 2, this.data.y)
      doorMesh.rotateY(this.angle * -1);
      return [doorMesh]
    }
  }

  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < this.width * zoomLevel) {
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
      console.log('after', obj.type, line, nearestAngle)
      const allLineKey = obj.getMineBeSnapLines().map(v => [v[0].x, v[0].y, v[1].x, v[1].y].join(','))
      const lineKey = [p1.x, p1.y, p2.x, p2.y].join(',')
      const index = allLineKey.indexOf(lineKey)
      console.log('after---', obj.getMineBeSnapLines(), line, index)
      this.data.wallId = obj.data.id as string
      if (index !== -1) {
        // console.log('doorPointId-set', index)
        this.data.wallPointId = index
      }
      this.data.angle = nearestAngle
    }
  }
}
