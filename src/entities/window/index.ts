import { Point, HandelInfo } from '@/types/map2d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { Window } from './index.d'
import * as THREE from 'three'
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { World } from '@/utils/world';

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
    hasBorder: false,// 是否有窗户框
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
    {
      id: 'hasBorder',
      label: '是否有窗户框',
      dataType: 'boolean',
    }
  ]
}

export class WindowEntity extends EntityClass<Window> {
  type: EntityType = 'window'
  height: number
  isPointObj: boolean = true

  constructor(world: World, window: Window) {
    super(world, window)
    if (window.wallId) {
      const wall = this.world.allFileMapObjects.wall.find((entity) => {
        return entity.getData().id === window.wallId
      });
      if (wall) {
        this.associationEntity.push(wall)
        wall.associationEntity.push(this)
      }
    }
    this.height = window.height
  }

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    wallThickness: number,
    zoomLevel: number
  ): void {
    const data = this.getData();
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

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
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < 6 * zoomLevel) {
      return {
        index: 0,
        id: data.id,
        type: this.type,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
    this.changePosition({ x, y })
  }

  create3DMesh(scene: THREE.Scene) {
    const data = this.getData();
    const group = new THREE.Group();
    const wall = this.world.allFileMapObjects.wall.find((entity) => {
      return entity.getData().id === data.wallId;
    })
    const wallThickness = wall ? wall.getData().thickness : 10;
    const geometry = new THREE.BoxGeometry(
      data.width * 1,
      data.height * 1,
      1
    );// 额外增加2保证，门框比强款一点
    const material = new THREE.MeshStandardMaterial({ color: 'white', opacity: 0.1, transparent: true })
    const windowMesh = new THREE.Mesh(geometry, material)
    group.add(windowMesh);

    // group添加门框
    (() => {
      if (!data.hasBorder) return
      const border = 7;
      const geometryRight = new THREE.BoxGeometry(
        border,
        data.height * 1,
        wallThickness + 4
      );
      const material = new THREE.MeshStandardMaterial({ color: data.color })
      const doorMeshRight = new THREE.Mesh(geometryRight, material)
      doorMeshRight.position.setX(data.width / 2)
      group.add(doorMeshRight);

      const geometryLeft = new THREE.BoxGeometry(
        border,
        data.height * 1,
        wallThickness + 4
      );
      const doorMeshLeft = new THREE.Mesh(geometryLeft, material)
      doorMeshLeft.position.setX(-data.width / 2)
      group.add(doorMeshLeft);

      const geometryTop = new THREE.BoxGeometry(
        data.width * 1 + border,
        border,
        wallThickness + 4
      );
      const doorMeshTop = new THREE.Mesh(geometryTop, material)
      doorMeshTop.position.setY(data.height / 2)
      group.add(doorMeshTop);

      const geometryBottom = new THREE.BoxGeometry(
        data.width * 1 + border,
        border,
        wallThickness + 4
      );
      const doorMeshBottom = new THREE.Mesh(geometryBottom, material)
      doorMeshBottom.position.setY(-data.height / 2)
      group.add(doorMeshBottom);
    })();
    group.position.set(data.x, data.height / 2 + (data.bottom || 0), data.y)
    group.rotateY(data.angle * -1);
    if (wall && data.wallPointId > -1 && wall.meshList[data.wallPointId]) {
      const wallGroup = wall.meshList[data.wallPointId];
      const subtractGeometry = new THREE.BoxGeometry(
        data.width,
        data.height,
        wallThickness + 10
      );
      subtractGeometry.rotateY(data.angle * -1);
      const cylinderBrush = new Brush(subtractGeometry);
      cylinderBrush.position.set(data.x, data.height / 2 - 1 + (data.bottom || 0), data.y)
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
        firstMesh.geometry = resultGeometry.geometry;
      }
      // // 4. 创建最终的网格
      // const material = new THREE.MeshStandardMaterial({ color: 0x00aaff, side: THREE.DoubleSide });
      // const resultMesh = new THREE.Mesh(resultGeometry.geometry, material);
      // resultMesh.position.set(wallMesh.position.x, wallMesh.position.y, wallMesh.position.z + 3)
      // resultMesh.rotateY(this.data.angle * -1);
      return [
        group,
        // resultMesh
      ]
    } else {
      return [
        group
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
    const data = this.getData();
    return [{
      objType: this.type,
      objId: data.id,
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

  afterBeSnapByLine(obj: EntityClass<Window>, line: [Point, Point]) {
    if (obj.type === 'wall') {
      const p1 = line[0]
      const p2 = line[1]
      const nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

      const allLineKey = obj.getMineBeSnapLines().map(v => [v[0].x, v[0].y, v[1].x, v[1].y].join(','))
      const lineKey = [p1.x, p1.y, p2.x, p2.y].join(',')
      const index = allLineKey.indexOf(lineKey)
      const data = this.getData();
      const objData = obj.getData()
      data.angle = nearestAngle
      data.wallId = objData.id
      data.wallPointId = index

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
    }
  }
}
