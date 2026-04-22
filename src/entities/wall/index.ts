import { Point, HandelInfo } from '@/types/map2d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { Wall } from './index.d'
import { drawPoint } from '@/utils/drawPoint'
import { createAllWallFromPoints } from '@/utils/createAllWallFromPoints'
import * as THREE from 'three'
import { editItem } from '..'
import { World } from '@/utils/world'

export function editPropConfig(): editItem[] {
  return [
    {
      id: 'thickness',
      label: '墙体厚度',
      dataType: 'number',
    },
    {
      id: 'color',
      label: '颜色',
      dataType: 'color',
    },
  ]
}

export class WallEntity extends EntityClass<Wall> {
  type: EntityType = 'wall'
  isPointObj: boolean = false

  draw2D(
    ctx: CanvasRenderingContext2D,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const wallBoxList = createAllWallFromPoints([this.getData()]);

    ctx.strokeStyle = 'black'
    ctx.fillStyle = this.getData().color
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.beginPath();

    for (let i = 0; i < wallBoxList.length; i++) {
      const box = wallBoxList[i]
      ctx.beginPath()
      for (let j = 0; j < box.length; j++) {
        const screenX = box[j].x * zoomLevel + panOffset.x
        const screenY = box[j].y * zoomLevel + panOffset.y
        if (j === 0) {
          ctx.moveTo(screenX, screenY)
        } else {
          ctx.lineTo(screenX, screenY)
        }
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fill()
    }

    // 绘制墙上的点
    [this.getData()].forEach((wall) => {
      if (wall.points.length < 2) return
      ctx.strokeStyle = 'black'
      ctx.fillStyle = 'white'
      ctx.lineWidth = 2
      wall.points.forEach((point: Point) => {
        const screenX = point.x * zoomLevel + panOffset.x
        const screenY = point.y * zoomLevel + panOffset.y
        ctx.beginPath()
        ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fill()
      })
    });
  }

  create3DMesh(scene: THREE.Scene) {
    const meshList: THREE.Group[] = []
    const wallBoxList = createAllWallFromPoints([this.getData()]);
    const wallHeight = 280
    const extrudeSettings = {
      steps: 1,
      depth: wallHeight,
      bevelEnabled: true,
      // bevelThickness: 2,
      // bevelSize: 2,
      // bevelSegments: 1
    }
    console.log('wallBoxList', wallBoxList)
    for (let i = 0; i < wallBoxList.length; i++) {
      const box = wallBoxList[i]

      const points = [];
      for (let j = 0; j < box.length; j++) {
        points.push(new THREE.Vector2(box[j].x, box[j].y * -1))
      }
      const shape = new THREE.Shape(points)
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      geometry.rotateX(-Math.PI / 2);   // 将 XY 平面旋转成 XZ 平面
      const material = new THREE.MeshStandardMaterial({
        color: this.getData().color,
        side: THREE.DoubleSide
      })
      const wallMesh = new THREE.Mesh(geometry, material)
      // wallMesh.position.set(0, 0, 0)
      wallMesh.castShadow = true
      wallMesh.receiveShadow = true
      const group = new THREE.Group()
      group.add(wallMesh)
      meshList.push(group)
    }

    // 盖一个地板
    const floorDepth = 1
    const extrudeSettingsBottom = {
      steps: 1,
      depth: floorDepth,
      bevelEnabled: true,
    }
    const points: THREE.Vector2[] = []; // wall.points.map((p) => new THREE.Vector2(p.x, p.y))
    this.getData().points.forEach((mesh) => {
      points.push(new THREE.Vector2(mesh.x, mesh.y * -1))
    })
    const shape = new THREE.Shape(points)
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettingsBottom)
    geometry.rotateX(-Math.PI / 2);   // 将 XY 平面旋转成 XZ 平面
    const material = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      side: THREE.DoubleSide
    })
    const floorMesh = new THREE.Mesh(geometry, material)
    floorMesh.position.set(0, floorDepth * -1 + 1, 0)
    const group = new THREE.Group()
    group.add(floorMesh)
    meshList.push(group)

    // 盖一个盖子
    const geometryTop = new THREE.ShapeGeometry(shape)
    geometryTop.rotateX(-Math.PI / 2);   // 将 XY 平面旋转成 XZ 平面
    const materialTop = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      side: THREE.BackSide
    })
    const topMesh = new THREE.Mesh(geometryTop, materialTop)
    topMesh.position.set(0, wallHeight, 0)
    const group2 = new THREE.Group()
    group2.add(topMesh)
    meshList.push(group2)

    return meshList
  }

  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const data = this.getData();
    for (let i = 0; i < this.getData().points.length; i++) {
      const point = this.getData().points[i]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < this.getData().thickness * zoomLevel) {
        return {
          id: data.id,
          type: this.type,
          index: i,
        }
      }
    }
    return null
  }

  matchHandelMoveCallback(x: number, y: number, matchHandelInfo: HandelInfo) {
    if (matchHandelInfo.index !== undefined) {
      this.remove3DCache()
      this.getData().points[matchHandelInfo.index] = { x, y }
    }
  }

  inSceneSnapPointArea(
    newPosition: MatchSnapPoint,
    dragHandelInfo: HandelInfo
  ) {
    if (newPosition.snapFromType === 'point') {
      // 暂时没有考虑好怎么写磁吸到边的情况，因为暂时无法排除自己，所以只命中point磁吸
      // console.log('MatchSnapPoint-3', newPosition.point, dragHandelInfo.index)
      this.getData().points[dragHandelInfo.index] = newPosition.point
      return true
    }
    return false;
  }

  getMineBeSnapPoints() {
    const key: allSnapFromType = 'point';
    const data = this.getData();
    return this.getData().points.map((v, index: number) => {
      return {
        objType: this.type,
        objId: data.id,
        snapFromType: key,
        point: { ...v, index },
      }
    })
  }

  getMineBeSnapLines(): Array<[Point, Point]> {
    const lines: Array<[Point, Point]> = []
    for (let i = 0; i < this.getData().points.length - 1; i++) {
      const p1 = this.getData().points[i]
      const p2 = this.getData().points[i + 1]
      lines.push([p1, p2])
    }
    return lines;
  }

  afterBeSnapByLine(obj: { type: EntityType }, line: [Point, Point]) {
  }
}
