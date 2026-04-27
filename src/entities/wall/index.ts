import { Point, HandelInfo } from '@/types/map2d'
import { allSnapFromType, EntityClass, EntityType, MatchSnapPoint } from '@/types/entity'
import { WallData } from './index.d'
import { drawPoint } from '@/utils/drawPoint'
import { createAllWallFromPoints } from '@/utils/createAllWallFromPoints'
import * as THREE from 'three'
import { editItem } from '..'
import { getMaterialById } from '@/material'
import { ObjDataClass } from '../objData'

export class WallDataClass extends ObjDataClass<WallData> {
  points: Point[]
  thickness: number
  color: string
  height: number
  wmt: number // 墙材质
  hb: boolean // 是否有地板
  bc: string // 地板颜色
  bmt: number // 地板材质
  ht: boolean // 是否有天花板
  tc: string // 天花板颜色
  tmt: number // 天花板材质
  td: boolean // 天花板是否是双面

  constructor(data: WallData) {
    super(data)
    this.points = data.points
    this.thickness = data.thickness
    this.height = data.height
    this.color = data.color
    this.wmt = data.wmt
    this.hb = data.hb
    this.bc = data.bc
    this.bmt = data.bmt
    this.ht = data.ht
    this.tc = data.tc
    this.tmt = data.tmt
    this.td = data.td
  }
}

export function editPropConfig(): editItem[] {
  return [
    {
      id: 'thickness',
      label: '墙体厚度',
      dataType: 'number',
      min: 0,
      max: Infinity,
      step: 1,
    },
    {
      id: 'height',
      label: '墙体高度',
      dataType: 'number',
      min: 1,
      max: Infinity,
      step: 1,
    },
    {
      id: 'color',
      label: '墙体颜色',
      dataType: 'color',
    },
    {
      id: 'wmt',
      label: '墙体材质',
      dataType: 'material',
    },
    {
      id: 'hb',
      label: '是否有地板',
      dataType: 'boolean',
    },
    {
      id: 'bc',
      label: '地板颜色',
      dataType: 'color',
    },
    {
      id: 'bmt',
      label: '地板材质',
      dataType: 'material',
    },
    {
      id: 'ht',
      label: '是否有天花板',
      dataType: 'boolean',
    },
    {
      id: 'tc',
      label: '天花板颜色',
      dataType: 'color',
    },
    {
      id: 'tmt',
      label: '天花板材质',
      dataType: 'material',
    },
    {
      id: 'td',
      label: '天花板是否是双面',
      dataType: 'boolean',
    },
  ]
}

export class WallEntity extends EntityClass<WallData> {
  type: EntityType = 'wall'
  isPointObj: boolean = false

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: WallData, panOffset: Point, zoomLevel: number): void {

  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: WallData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    if (data.hb) {
      ctx.strokeStyle = 'black'
      ctx.fillStyle = data.bc
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      for (let i = 0; i < data.points.length; i++) {
        const point = data.points[i]
        if (i === 0) {
          ctx.moveTo(point.x * zoomLevel + panOffset.x, point.y * zoomLevel + panOffset.y)
        } else {
          ctx.lineTo(point.x * zoomLevel + panOffset.x, point.y * zoomLevel + panOffset.y)
        }
      }
      ctx.stroke()
      ctx.fill()
    }
    const wallBoxList = createAllWallFromPoints([data]);

    ctx.strokeStyle = 'black'
    ctx.fillStyle = data.color
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
    [data].forEach((wall) => {
      if (!wall.points || wall.points.length < 2) return
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
    const data = this.getData()
    const meshList: THREE.Group[] = []
    const wallBoxList = createAllWallFromPoints([data]);
    const wallHeight = data.height
    const extrudeSettings = {
      steps: 1,
      depth: wallHeight,
      bevelEnabled: true,
      // bevelThickness: 2,
      // bevelSize: 2,
      // bevelSegments: 1
    }
    for (let i = 0; i < wallBoxList.length; i++) {
      const box = wallBoxList[i]

      const points = [];
      for (let j = 0; j < box.length; j++) {
        points.push(new THREE.Vector2(box[j].x, box[j].y * -1))
      }
      const shape = new THREE.Shape(points)
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      geometry.rotateX(-Math.PI / 2);   // 将 XY 平面旋转成 XZ 平面
      // 计算点points[0]到points[1]的方向向量
      const direction = new THREE.Vector3(box[1].x - box[0].x, 0, box[1].y - box[0].y).normalize()
      // 将方向向量旋转90度
      const rotatedDirection = new THREE.Vector3(-direction.z, direction.y, direction.x)

      const material = getMaterialById(this.getData().wmt)?.material(rotatedDirection) || new THREE.MeshStandardMaterial({
        color: this.getData().color,
        side: THREE.DoubleSide
      })
      const wallMesh = new THREE.Mesh(geometry, material)
      // wallMesh.position.set(0, 0, 0)
      // console.log('this.getData() ', this.getData())
      wallMesh.castShadow = true
      wallMesh.receiveShadow = true
      const group = new THREE.Group()
      group.add(wallMesh)
      meshList.push(group)
    }

    const points: THREE.Vector2[] = []; // wall.points.map((p) => new THREE.Vector2(p.x, p.y))
    data.points.forEach((mesh: Point) => {
      points.push(new THREE.Vector2(mesh.x, mesh.y * -1))
    })
    const shape = new THREE.Shape(points)
    // 盖一个地板
    if (data.hb) {
      const floorDepth = 1
      const extrudeSettingsBottom = {
        steps: 1,
        depth: floorDepth,
        bevelEnabled: true,
      }
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettingsBottom)
      geometry.rotateX(-Math.PI / 2);   // 将 XY 平面旋转成 XZ 平面
      const materialBottom = data.bmt ? (getMaterialById(data.bmt)?.material(new THREE.Vector3(0, 1, 0))) : (new THREE.MeshStandardMaterial({
        color: data.bc,
        side: THREE.DoubleSide
      }));
      const floorMesh = new THREE.Mesh(geometry, materialBottom)
      floorMesh.position.set(0, floorDepth * -1 + 1, 0)
      const group = new THREE.Group()
      group.add(floorMesh)
      meshList.push(group)
    }

    // 盖一个盖子
    if (this.getData().ht) {
      const geometryTop = new THREE.ShapeGeometry(shape)
      geometryTop.rotateX(-Math.PI / 2);   // 将 XY 平面旋转成 XZ 平面
      const mater = getMaterialById(this.getData().tmt)?.material(new THREE.Vector3(0, 1, 0));
      if (mater) {
        mater.side = data.td ? THREE.DoubleSide : THREE.BackSide;
      }
      const materialTop = mater || (new THREE.MeshStandardMaterial({
        color: data.tc,
        side: data.td ? THREE.DoubleSide : THREE.BackSide
      }));
      const topMesh = new THREE.Mesh(geometryTop, materialTop)
      topMesh.position.set(0, wallHeight + 1, 0)
      const group2 = new THREE.Group()
      group2.add(topMesh)
      meshList.push(group2)
    }
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
    return this.getData().points.map((v: Point, index: number) => {
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

  setPrepareState(x: number, y: number): void {
  }
}
