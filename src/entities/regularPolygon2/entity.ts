import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { RegularPolygon2Data } from "./index.d"
import { PointEntityClass } from '@/types/pointEntity'
import { editItem } from '..';
import { MatchCircleArea } from '@/utils/matchArea';
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

export class RegularPolygonEntity extends PointEntityClass<RegularPolygon2Data> {
  name: string = 'N边形锥'
  type: string = 'regularPolygon2';
  private circleRadius = 6

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: RegularPolygon2Data, panOffset: Point, zoomLevel: number): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { n, r, r2, angleY } = data;

    ctx.fillStyle = data.color
    ctx.save();
    ctx.translate(screenX, screenY);

    const bottomPoints = getAllPointsByN(0, 0, n, r, angleY * -1)
    if (bottomPoints.length >= 3) {
      ctx.beginPath()
      bottomPoints.forEach((point, index) => {
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

    if (r2 > 0) {
      const topPoints = getAllPointsByN(0, 0, n, r2, angleY * -1)
      if (topPoints.length >= 3) {
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'
        ctx.lineWidth = 2 * zoomLevel
        ctx.beginPath()
        topPoints.forEach((point, index) => {
          const px = point.x * zoomLevel
          const py = point.y * zoomLevel
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

    ctx.restore();
  }

  draw2DHandleByData(
    ctx: CanvasRenderingContext2D,
    data: RegularPolygon2Data,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const screenX = data.x * zoomLevel + panOffset.x
    const screenY = data.y * zoomLevel + panOffset.y
    const { n, r, angleY, r2 } = data

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
    const bottomPoints = getAllPointsByN(data.x, data.y, n, r, angleY * -1)
    if (bottomPoints.length >= 3) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'blue'
      ctx.beginPath()
      bottomPoints.forEach((point, index) => {
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

    if (r2 > 0) {
      const topPoints = getAllPointsByN(data.x, data.y, n, r2, angleY * -1)
      if (topPoints.length >= 3) {
        ctx.lineWidth = 2
        ctx.strokeStyle = 'green'
        ctx.setLineDash([5 * zoomLevel, 5 * zoomLevel])
        ctx.beginPath()
        topPoints.forEach((point, index) => {
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
        ctx.setLineDash([])
      }
    }
  }

  glbObj: THREE.Group | null = null;

  create3DMesh() {
    const data = this.getData();
    const group = new THREE.Group()

    const { n, r, r2, h, color, angleY } = data;

    const bottomPoints = getAllPointsByN(0, 0, n, r, angleY)
    if (bottomPoints.length < 3) {
      return [group]
    }

    const geometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    const addPoint = (x: number, y: number, z: number) => {
      vertices.push(x, y, z)
    }

    const bottomOffset = 0
    bottomPoints.forEach(p => {
      addPoint(p.x, 0, p.y * -1)
    })

    const isPyramid = r2 <= 0
    const topOffset = bottomPoints.length

    if (isPyramid) {
      addPoint(0, h, 0)
    } else {
      const topPoints = getAllPointsByN(0, 0, n, r2, angleY)
      topPoints.forEach(p => {
        addPoint(p.x, h, p.y * -1)
      })
    }

    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n
      if (isPyramid) {
        indices.push(bottomOffset + i, bottomOffset + next, topOffset)
      } else {
        indices.push(bottomOffset + i, bottomOffset + next, topOffset + i)
        indices.push(topOffset + i, bottomOffset + next, topOffset + next)
      }
    }

    if (!isPyramid) {
      for (let i = 2; i < n; i++) {
        indices.push(topOffset, topOffset + i, topOffset + i - 1)
      }
    }

    for (let i = 2; i < n; i++) {
      indices.push(bottomOffset, bottomOffset + i - 1, bottomOffset + i)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    // geometry.computeVertexNormals()

    const material = new THREE.MeshStandardMaterial({ color })
    const mesh = new THREE.Mesh(geometry, material)
    group.add(mesh);
    return [
      group
    ]
  }

  createBoundingBox(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
    const { r, h } = this.getData();
    // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
    return [
      new THREE.Vector3(r * 2, 100, r * 2),
      new THREE.Vector3(0, h / 2, 0),
      new THREE.Vector3(0, 0, 0)
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
        label: '底部半径',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 1,
        value: data.r,
      },
      // {
      //   id: 'r2',
      //   label: '顶部半径',
      //   dataType: 'number',
      //   min: 0,
      //   max: Infinity,
      //   step: 1,
      //   value: data.r2,
      // },
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
      },
      {
        id: 'h',
        label: '高度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 1,
        value: data.h,
      },
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

  setPrepareState(x: number, y: number): string[] {
    this.setData({
      ...this.getData(),
      x,
      y,
    })
    return [];
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
    this.changeBoundingBoxState()
  }
}
