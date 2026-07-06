import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { RegularPolygonPlaneData } from './index.d'
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '..';
import { getMaterialById } from '@/material';
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { MatchRectArea, MatchCircleArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';

function getAllPointsByN(x: number, y: number, n: number, r: number, angle: number): Point[] {
  const points: Point[] = []
  if (n < 3) {
    return points
  }
  const angleStep = (Math.PI * 2) / n
  for (let i = 0; i < n; i++) {
    const angleItem = angleStep * i + angle
    points.push({
      x: x + r * Math.cos(angleItem),
      y: y + r * Math.sin(angleItem),
    })
  }
  return points
}

export class RegularPolygonPlaneEntity extends PointEntityClass<RegularPolygonPlaneData> {
  name: string = 'N边形体'
  type: string = 'cube'
  isPointObj: boolean = true
  private circleRadius = 6

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: RegularPolygonPlaneData, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { n, r, angleY } = data;

    ctx.fillStyle = data.color
    ctx.save();
    ctx.translate(screenX, screenY);

    const polygonPoints = getAllPointsByN(0, 0, n, r, angleY * -1)
    if (polygonPoints.length >= 3) {
      ctx.beginPath()
      polygonPoints.forEach((point, index) => {
        const px = point.x * zoomLevel
        const py = point.y * zoomLevel
        if (index === 0) {
          ctx.moveTo(px, py)
        } else {
          ctx.lineTo(px, py)
        }
      })
      ctx.closePath()
      ctx.fill()
    }

    ctx.restore();
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: RegularPolygonPlaneData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { n, r, angleY } = data

    // 控制点
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    const drawAngelLength = Math.max(this.getData().r, this.circleRadius * 2) * 0.7;// 0.7避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength
    const circleX = rotatedXAdd * zoomLevel + panOffset.x
    const circleY = rotatedYAdd * zoomLevel + panOffset.y
    const circleRadius = this.circleRadius * zoomLevel + 3

    function ttt(angel: number, drawAngelLength: number) {
      const tempX = data.x + Math.cos(angel) * drawAngelLength;
      const tempY = data.y - Math.sin(angel) * drawAngelLength;
      return [tempX * zoomLevel + panOffset.x, tempY * zoomLevel + panOffset.y]
    }

    // 绘制双向箭头表示旋转角度
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#e67e22'
    ctx.lineWidth = 2 * zoomLevel
    // 绘制双向箭头的主线（圆弧）
    ctx.beginPath();
    ctx.arc(screenX, screenY, drawAngelLength * zoomLevel, data.angleY * -1 - Math.PI / 4, data.angleY * -1 + Math.PI / 4);
    ctx.stroke();

    // 左侧箭头
    (() => {
      ctx.beginPath()
      const [p1X, p1Y] = ttt(data.angleY + 0.1 + Math.PI / 4, drawAngelLength)
      const [p2X, p2Y] = ttt(data.angleY + Math.PI / 4, drawAngelLength + 5)
      const [p3X, p3Y] = ttt(data.angleY + Math.PI / 4, drawAngelLength - 5)
      ctx.moveTo(
        p1X,
        p1Y
      )
      ctx.lineTo(p2X, p2Y)
      ctx.lineTo(p3X, p3Y)
      ctx.closePath()
      ctx.fill()
    })();

    // 右侧箭头
    (() => {
      ctx.beginPath()
      const [p1X, p1Y] = ttt(data.angleY - 0.1 - Math.PI / 4, drawAngelLength)
      const [p2X, p2Y] = ttt(data.angleY - Math.PI / 4, drawAngelLength + 5)
      const [p3X, p3Y] = ttt(data.angleY - Math.PI / 4, drawAngelLength - 5)
      ctx.moveTo(
        p1X,
        p1Y
      )
      ctx.lineTo(p2X, p2Y)
      ctx.lineTo(p3X, p3Y)
      ctx.closePath()
      ctx.fill()
    })();

    // 绘制旋转角度控制
    ctx.beginPath()
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 绘制 轮廓
    const polygonPoints = getAllPointsByN(data.x, data.y, n, r, angleY * -1)
    if (polygonPoints.length >= 3) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'blue'
      ctx.beginPath()
      polygonPoints.forEach((point, index) => {
        const px = point.x * zoomLevel + panOffset.x
        const py = point.y * zoomLevel + panOffset.y
        if (index === 0) {
          ctx.moveTo(px, py)
        } else {
          ctx.lineTo(px, py)
        }
      })
      ctx.closePath()
      ctx.stroke()
    }
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { n, r, height, color, angleY } = data;

    const polygonPoints = getAllPointsByN(0, 0, n, r, angleY)
    if (polygonPoints.length < 3) {
      return [group]
    }

    const shapePoints: THREE.Vector2[] = polygonPoints.map(p => new THREE.Vector2(p.x, p.y * -1))
    const shape = new THREE.Shape(shapePoints)

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: false,
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.rotateX(-Math.PI / 2)

    const materials = [];
    const defaultMat = new THREE.MeshStandardMaterial({ color });
    for (let i = 0; i < 6; i++) {
      materials.push(defaultMat);
    }

    const mesh = new THREE.Mesh(geometry, materials)
    group.add(mesh);
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { n, r, height, angleY } = this.getData();
    return [
      new THREE.Vector3(r, r, height),
      new THREE.Vector3(0, r / 2, 0),
      new THREE.Vector3(0, angleY, 0)
    ]
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < data.r) {
      return new MatchCircleArea({ x: data.x, y: data.y, r: data.r })
    }
    return null;
  }

  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    const dist = Math.hypot(x - data.x, y - data.y)
    if (dist < this.circleRadius + 3) {
      return {
        index: 0,
        type: this.type,
        id: data.id,
        dist,
      }
    }
    const drawAngelLength = Math.max(this.getData().r, this.circleRadius * 2) * 0.7;// 0.7避免超过方块范围
    // 控制点向着angleY角度延伸10个单位后的坐标
    const rotatedXAdd = data.x + Math.cos(data.angleY) * drawAngelLength
    const rotatedYAdd = data.y - Math.sin(data.angleY) * drawAngelLength

    const dist2 = Math.hypot(x - rotatedXAdd, y - rotatedYAdd)
    // console.log('dist2', dist2)
    if (dist2 < this.circleRadius + 3) {
      return {
        index: 1,
        type: this.type,
        id: data.id,
        dist: dist2,
      }
    }
    return null;
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    const { x, y } = position
    if (matchHandelInfo.index === 0) {
      this.changePosition({ x, y })
    } else if (matchHandelInfo.index === 1) {
      const data = this.getData();
      // 根据x,y计算angleY
      const angleY = Math.atan2(y - data.y, x - data.x)
      this.setData({
        ...this.getData(),
        angleY: angleY * -1,
      })
    }
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

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow([
      {
        id: 'n',
        label: '边数',
        dataType: 'number',
        min: 3,
        max: 12,
        step: 1,
        value: data.n,
      },
      {
        id: 'r',
        label: '半径',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 1,
        value: data.r,
      },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color,
      },
      {
        id: 'z',
        label: '距离地面',
        dataType: 'number',
        min: -100,
        max: 100,
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

  inSceneSnapPointArea() {
    return false
  }

  inSceneSnapLineArea() {
    return false
  }

  setPrepareState(x: number, y: number): void {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
  }

  meshNeedChangeKey() {
    const data = this.getData();
    const cacheData = {
      ...data,
      x: undefined,
      y: undefined,
      z: undefined,
      angleY: undefined,
    }
    return this.type + JSON.stringify(cacheData)
  }

  // 改变3D模型的状态
  // 例如：改变位置，旋转角度等，模型本身不变
  change3DMeshState(): void {
    const data = this.getData();
    this.meshList.forEach(v => {
      v.position.set(data.x, data.z, data.y)
      v.rotation.y = data.angleY
    })
  }
}
