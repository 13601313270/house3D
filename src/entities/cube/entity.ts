import { HandelInfo, Point } from '@/types/map2d'
import * as THREE from 'three'
import { CubeData } from './index.d'
import { allSnapFromType, EntityClass, MatchSnapPoint } from '@/types/entity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { DoorCubeClass } from './dataClass'

export class CubeEntity extends EntityClass<CubeData> {
  type: string = 'cube'
  isPointObj: boolean = true

  defaultValue(): CubeData {
    const door: CubeData = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      width: 110,
      height: 180,
      depth: 100,
      color: '#e67e22',
      mt: 3,
    }
    return new DoorCubeClass(door)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: CubeData, panOffset: Point, zoomLevel: number): void {
    const { width, height, depth } = data;
    // 实现门的2D绘制逻辑
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    // 绘制一个方块
    ctx.fillStyle = data.color
    ctx.fillRect(
      screenX - width / 2 * zoomLevel,
      screenY - depth / 2 * zoomLevel,
      width * zoomLevel,
      depth * zoomLevel
    )
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: CubeData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    // 实现门的2D绘制逻辑
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, 6 * zoomLevel, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  glbObj: THREE.Group | null = null;

  create3DMesh(scene: THREE.Scene) {
    const data = this.getData();
    const group = new THREE.Group()

    const { width, height, depth, color, mt } = data;

    // group添加门框
    const geometryRight = new THREE.BoxGeometry(
      width,
      height,
      depth
    );
    const material = data.mt ? (getMaterialById(data.mt)?.material(new THREE.Vector3(0, 0, 1))) : (new THREE.MeshStandardMaterial({ color: data.color }));
    const doorMeshRight = new THREE.Mesh(geometryRight, material)
    doorMeshRight.position.setY(data.height / 2)
    group.add(doorMeshRight);

    // group.position.set(data.x, data.height / 2, data.y)
    // group.rotateY(data.angle * -1);
    return [
      group
    ]
  }

  matchHandelInfo(x: number, y: number, zoomLevel: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < 6 * zoomLevel) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist: dist,
      }
    }
    return null;
  }

  matchHandelMoveCallback(x: number, y: number) {
    this.changePosition({ x, y })
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

  setData(data: CubeData) {
    // 双向去除原有的关联对象
    this.associationEntity.forEach(entity => {
      if (entity.associationEntity.includes(this)) {
        entity.remove3DCache()
      }
    })
    super.setData(data)
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow([
      {
        id: 'width',
        label: '长度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 10,
        value: data.width,
      },
      {
        id: 'depth',
        label: '宽度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 10,
        value: data.depth,
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
    ], (val) => {
      this.setData({
        ...data,
        ...val,
      })
    })
  }

  inSceneSnapPointArea(newPosition: MatchSnapPoint) {
    return false
  }

  inSceneSnapLineArea(obj: EntityClass<CubeData>, line: [Point, Point]) {
    return false
  }

  setPrepareState(x: number, y: number): void {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
  }
}
