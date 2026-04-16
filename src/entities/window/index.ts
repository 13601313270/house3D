import { Point, Entity, HandelInfo } from '@/types/map2d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { Window } from './index.d'
import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { Wall } from '../wall/index.d';
import { WallEntity } from '../wall';

export class WindowEntity extends EntityClass<Window> {
  type: EntityType = 'window'
  width: number
  height: number
  angle: number
  color: string

  constructor(window: Window) {
    super(window)
    this.width = window.width
    this.angle = window.angle
    this.height = window.height
    this.color = '#3498db'
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    wallThickness: number,
    zoomLevel: number
  ): void {
    const screenX = this.data.x * zoomLevel + panOffset.x
    const screenY = this.data.y * zoomLevel + panOffset.y

    const color = '#3498db'
    const width = this.width * zoomLevel;
    const thickness = 20 * zoomLevel;

    ctx.save()
    ctx.translate(screenX, screenY)
    ctx.rotate(this.angle)

    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.fillRect(-width / 2, -thickness / 2, width, thickness)
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.restore()

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = this.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number, zoomLevel: number): HandelInfo | null {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < this.width * zoomLevel) {
      return {
        index: 0,
        id: this.data.id,
        type: this.type,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
    this.changePosition({ x, y })
  }

  draw3D(wall: WallEntity) {
    const wallThickness = wall.data.thickness;
    const geometry = new THREE.BoxGeometry(
      this.width * 1,
      this.height * 1,
      1
    );// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: 0xe67e22 })
    const windowMesh = new THREE.Mesh(geometry, material)
    if (this.data.wallPointId > -1 && wall.meshList[this.data.wallPointId]) {
      const wallMesh = wall.meshList[this.data.wallPointId];

      const subtractGeometry = new THREE.BoxGeometry(
        this.width,
        this.height,
        wallThickness + 10
      );
      const cylinderBrush = new Brush(subtractGeometry);
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
      windowMesh.position.set(this.data.x, this.height / 2, this.data.y)
      // mesh缩放到90%
      windowMesh.scale.set(0.99, 0.99, 0.99)
      windowMesh.rotateY(this.angle * -1);
      return [
        windowMesh,
        // resultMesh
      ]
    } else {
      windowMesh.position.set(this.data.x, this.height / 2, this.data.y)
      windowMesh.rotateY(this.angle * -1);
      return [
        windowMesh
      ]
    }
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

  afterBeSnapByLine(obj: EntityClass<Window>, line: [Point, Point]) {
    if (obj.type === 'wall') {
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

      const allLineKey = obj.getMineBeSnapLines().map(v => [v[0].x, v[0].y, v[1].x, v[1].y].join(','))
      const lineKey = [p1.x, p1.y, p2.x, p2.y].join(',')
      const index = allLineKey.indexOf(lineKey)
      this.data.angle = nearestAngle
      this.data.wallPointId = index
    }
  }
}
