import * as THREE from 'three'
import { HandelInfo, Point } from '@/types/map2d'
import { RegularPolygon2Data } from "./index.d"
import { editItem } from '@/utils/editItem';
import { MatchCircleArea } from '@/utils/matchArea';
import { allSnapFromType } from '@/types/baseEntity';
import { PointCanAngleEntity } from '@/types/pointCanAngleEntity';
import { resize } from '@/utils/handleImgs';

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

export class RegularPolygon2Entity extends PointCanAngleEntity<RegularPolygon2Data> {
  name: string = 'N边形锥'
  type: string = 'regularPolygon2';
  private circleRadius = 6
  canEditAnimationDataColumn: Array<keyof RegularPolygon2Data> = [];

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const screenX = data.x * zoomLevel
    const screenY = data.y * zoomLevel
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

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void {
    const data = this.getData();
    const { n, r, angleY, r2 } = data

    // 绘制 轮廓
    const bottomPoints = getAllPointsByN(data.x, data.y, n, r, angleY * -1)
    if (bottomPoints.length >= 3) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'blue'
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
        ctx.setLineDash([])
      }
    }
    // 控制点
    super.draw2DActionHandle(ctx, zoomLevel);
    // 调整半径的控制点
    (() => {
      const circleRadius = this.getCircleRadius() * zoomLevel + 3;
      const imgSize = circleRadius * 1.5;
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 2
      const screenX = (data.x + data.r) * zoomLevel;
      const screenY = data.y * zoomLevel;

      ctx.beginPath()
      ctx.arc(screenX, screenY, circleRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke();
      ctx.drawImage(resize, screenX - imgSize / 2, screenY - imgSize / 2, imgSize, imgSize);
    })();
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

  getBoundingBoxData(): [THREE.Vector3, THREE.Vector3, THREE.Vector3] {
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
    const data = this.getData()

    const circleRadius = this.getCircleRadius();

    const dist = Math.hypot(x - (data.x + data.r), y - data.y)
    if (dist < circleRadius) {
      return {
        index: 2,
        type: this.type,
        id: data.id,
        dist,
      }
    }

    return super.matchHandelInfo(x, y)
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
  }, matchHandelInfo: HandelInfo) {
    if (matchHandelInfo.index === 2) {
      const data = this.getData()
      const dist = Number((position.x - data.x).toFixed(1));
      this.setData({
        r: dist,
      } as Partial<RegularPolygon2Data>)
      return [dist + 'cm']
    } else {
      super.matchHandelMoveCallback(position, matchHandelInfo)
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

  getEditPropConfigData(data: RegularPolygon2Data): editItem[] {
    return [
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
    ]
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void): void {
    const data = this.getData();
    editShow(this.getEditPropConfigData(data), (val) => {
      this.setData({
        // ...data,
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

  create3DUnionKey() {
    const data = this.getData();
    const cacheData = {
      ...data,
      x: undefined,
      y: undefined,
      z: undefined,
      angleY: undefined,
    }
    return JSON.stringify(cacheData)
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
