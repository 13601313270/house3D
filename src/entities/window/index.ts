import { Point, HandelInfo } from '@/types/map2d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { Window } from './index.d'
import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { WallEntity } from '../wall';

export function createWindowData() {
  const window: Window = {
    id: Date.now().toString(),
    wallPointId: -1,
    wallId: '',
    x: 0,
    y: 0,
    z: 0,
    width: 120,
    height: 120,
    angle: 0,
    bottom: 40,
    color: '#3498db',
  }
  return window
}

type editItem = {
  id: string,
  label: string,
  dataType: 'number' | 'poiListAndLineCircle' | 'poiListAndLine' | 'poiList' | 'color' | 'boolean' | 'mesh' | 'area' | string[]/* 枚举 */
}

export function editPropConfig(): editItem[] {
  return [
    {
      id: 'bottom',
      label: '距离地面',
      dataType: 'number',
    },
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

export class WindowEntity extends EntityClass<Window> {
  type: EntityType = 'window'
  height: number
  isPointObj: boolean = true

  constructor(window: Window) {
    super(window)
    this.height = window.height
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    wallThickness: number,
    zoomLevel: number
  ): void {
    const screenX = this.data.x * zoomLevel + panOffset.x
    const screenY = this.data.y * zoomLevel + panOffset.y

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
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.restore()

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number, zoomLevel: number): HandelInfo | null {
    const dist = Math.hypot(x - this.data.x, y - this.data.y)
    if (dist < 6 * zoomLevel) {
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

  create3DMesh(wall: WallEntity) {
    const wallThickness = wall.data.thickness;
    const geometry = new THREE.BoxGeometry(
      this.data.width * 1,
      this.data.height * 1,
      1
    );// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: this.data.color })
    const windowMesh = new THREE.Mesh(geometry, material)
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
      cylinderBrush.position.set(this.data.x, this.data.height / 2 - 1 + (this.data.bottom || 0), this.data.y)
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
      // resultMesh.rotateY(this.data.angle * -1);
      windowMesh.position.set(this.data.x, this.height / 2 + (this.data.bottom || 0), this.data.y)
      // mesh缩放到90%
      windowMesh.scale.set(0.99, 0.99, 0.99)
      windowMesh.rotateY(this.data.angle * -1);
      return [
        windowMesh,
        // resultMesh
      ]
    } else {
      windowMesh.position.set(this.data.x, this.height / 2, this.data.y)
      windowMesh.rotateY(this.data.angle * -1);
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
