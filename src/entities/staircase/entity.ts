import { Point, HandelInfo } from '@/types/map2d'
import { StaircaseData, StaircasePoint } from './index.d'
import { createAllWallFromPoints } from '@/utils/createAllWallFromPoints'
import * as THREE from 'three'
import { editItem } from '..'
import { getMaterialById } from '@/material'
import { StaircaseDataClass } from './dataClass'
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea'
import { calculateAngle } from '@/utils/calculateAngle'
import message from '@/utils/message'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { allSnapFromType, MatchSnapPoint } from '@/types/baseEntity'
import { LineEntityClass } from '@/types/lineEntity'

export class StaircaseEntity extends LineEntityClass<StaircasePoint, StaircaseData> {
  name: string = '楼梯'
  type: string = 'staircase'
  isPointObj: boolean = false
  private circleRadius = 6
  private cornerType: 0 | 1 | 2 | 3 | 4 | 5 = 5;

  defaultValue(): StaircaseData {
    const staircase: StaircaseData = defaultStaircaseData
    return new StaircaseDataClass(staircase)
  }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: StaircaseData, panOffset: Point, zoomLevel: number): void {
    const { data: wallBoxList } = createAllWallFromPoints(data, this.cornerType)
    ctx.strokeStyle = 'black'
    ctx.fillStyle = data.color
    ctx.lineWidth = 2
    ctx.setLineDash([])

    for (let i = 0; i < wallBoxList.length; i++) {
      const box = wallBoxList[i]

      ctx.setLineDash([])

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
    ctx.setLineDash([])
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: StaircaseData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    const staircase = data;
    // 用红色绘制墙
    const { data: wallBoxList } = createAllWallFromPoints({
      points: data.points,
      thickness: data.thickness + 1,
    }, this.cornerType)
    ctx.strokeStyle = 'red'
    ctx.fillStyle = data.color
    ctx.lineWidth = 1
    ctx.setLineDash([])

    for (let i = 0; i < wallBoxList.length; i++) {
      const box = wallBoxList[i]
      ctx.setLineDash([])
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
      // ctx.fill()
    }
    ctx.setLineDash([])

    if (staircase.points && staircase.points.length >= 2) {
      // 绘制墙上的点
      ctx.lineWidth = 3
      staircase.points.forEach((point: Point, index: number) => {
        ctx.strokeStyle = 'red'
        ctx.fillStyle = 'white'
        const screenX = point.x * zoomLevel + panOffset.x
        const screenY = point.y * zoomLevel + panOffset.y
        ctx.beginPath()
        ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fill()
        ctx.closePath()
        if (index > 0 && index < staircase.points.length - 1) {
          const prev = staircase.points[index - 1]
          const next = staircase.points[index + 1]
          const angleResult = calculateAngle(prev, point, next)
          if (angleResult) {
            const { angle } = angleResult
            const angleText = `${Math.round(angle)}°`

            // 计算从point到prev的向量
            const v1x = prev.x - point.x;
            const v1y = prev.y - point.y;
            // 计算从point到next的向量
            const v2x = next.x - point.x;
            const v2y = next.y - point.y;

            // 归一化向量
            const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
            const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
            const unitV1x = v1x / len1;
            const unitV1y = v1y / len1;
            const unitV2x = v2x / len2;
            const unitV2y = v2y / len2;

            // 角平分线方向向量（两个单位向量相加）
            const bisectorX = unitV1x + unitV2x;
            const bisectorY = unitV1y + unitV2y;

            // 计算角平分线的角度（弧度）
            const angleAngel = Math.atan2(bisectorY, bisectorX);
            // console.log('angleAngel', angleAngel)
            // 计算角度文本位置：在夹角内侧
            const offset = {
              x: Math.cos(angleAngel) * 30,
              y: Math.sin(angleAngel) * 20
            }
            const angleX = screenX - offset.x * zoomLevel
            const angleY = screenY - offset.y * zoomLevel
            ctx.font = `${Math.max(20 * zoomLevel, 20)}px Arial`
            ctx.textBaseline = 'middle'
            ctx.strokeStyle = 'white'
            ctx.lineWidth = Math.max(3 * zoomLevel, 2)
            ctx.lineJoin = 'round'
            ctx.strokeText(angleText, angleX, angleY)
            ctx.fillStyle = 'red'
            ctx.fillText(angleText, angleX, angleY)
          }
        }
      });
      ctx.fillStyle = 'white'
      // 每两个点之间，再绘制一个点，代表边的控制器
      for (let i = 0; i < staircase.points.length - 1; i++) {
        const p1 = staircase.points[i]
        const p2 = staircase.points[i + 1]
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2
        const screenX = midX * zoomLevel + panOffset.x
        const screenY = midY * zoomLevel + panOffset.y
        ctx.strokeStyle = 'red'
        ctx.fillStyle = 'white'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fill()
        ctx.closePath()
        // 绘制p1到p2长度
        const len = Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y))
        const lenText = `${Math.round(len)}cm`
        ctx.font = `${Math.max(20 * zoomLevel, 20)}px Arial`
        ctx.textBaseline = 'middle'
        ctx.strokeStyle = 'white'
        ctx.lineWidth = Math.max(3 * zoomLevel, 2)
        ctx.lineJoin = 'round'
        ctx.fillStyle = 'red'
        // p1到p2的角度
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
        const textX = Math.abs(Math.tan(angle)) > 1 ? screenX + 30 * zoomLevel : screenX
        const textY = Math.abs(Math.tan(angle)) > 1 ? screenY : screenY + 20 * zoomLevel
        ctx.strokeText(lenText, textX, textY)
        ctx.fillText(lenText, textX, textY)
      }
    }
  }

  create3DMesh() {
    const data = this.getData()
    const meshList: THREE.Group[] = []
    const { data: wallBoxList, countPerPoint: countPerPointPerPoint } = createAllWallFromPoints(data, this.cornerType);
    console.log('countPerPointPerPoint', countPerPointPerPoint)
    const wallHeight = 100;
    const bottom = 0;
    // console.log(1)
    const extrudeSettings = {
      steps: 1,
      depth: wallHeight,
      bevelEnabled: true,
      // bevelThickness: 2,
      // bevelSize: 2,
      // bevelSegments: 1
    }
    // console.log('wallBoxList', wallBoxList)
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
      wallMesh.castShadow = true
      wallMesh.receiveShadow = true
      if (i % countPerPointPerPoint === 0) {
        // wallMesh.position.set(0, 0, 0)
        const pointData = data.points[i / countPerPointPerPoint];
        wallMesh.position.setY(bottom + (pointData.z || 0))
        // console.log('data[i]---1', JSON.parse(JSON.stringify(data.points)))
        // wallMesh.position.setZ(pointData.z || 100)
        // console.log('this.getData() ', this.getData())
        // console.log('data[i]---pointData', i, pointData, JSON.parse(JSON.stringify(pointData)))
      }
      const group = new THREE.Group()
      group.add(wallMesh)
      meshList.push(group)
    }

    const points: THREE.Vector2[] = []; // wall.points.map((p) => new THREE.Vector2(p.x, p.y))
    data.points.forEach((mesh: Point) => {
      points.push(new THREE.Vector2(mesh.x, mesh.y * -1))
    })
    return meshList
  }

  createBoundingBox() {
    return null
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const { points } = data;
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < this.getData().thickness / 4) {
        return new MatchCircleArea({
          x: point.x,
          y: point.y,
          r: this.getData().thickness / 4,
        })
      }
    }

    // 每两个点之间，再绘制一个点，代表边的控制器
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      const midX = (p1.x + p2.x) / 2
      const midY = (p1.y + p2.y) / 2
      const width = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      const angel = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      if (isPointInRotatedRect(x, y, {
        x: midX,
        y: midY,
        width,
        depth: this.getData().thickness + 2,
        angleY: angel,
      })) {
        return new MatchRectArea({
          x: midX,
          y: midY,
          width,
          depth: this.getData().thickness + 2,
          angleY: angel * -1,
        })
      }
      // const dist = Math.hypot(x - midX, y - midY)
      // if (dist < this.getData().thickness) {
      //   return new MatchCircleArea({
      //     x: midX,
      //     y: midY,
      //     r: this.getData().thickness,
      //   })
      // }
    }
    return null
  }

  private prePointStartPosition: Point | null = null
  private nextPointStartPosition: Point | null = null
  // 命中可拖拽具柄
  matchHandelInfo(x: number, y: number) {
    const data = this.getData();
    for (let i = 0; i < this.getData().points.length; i++) {
      const point = this.getData().points[i]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < this.getData().thickness / 4) {
        return {
          id: data.id,
          type: this.type,
          index: i * 2,
          dist,
        }
      }
    }

    // 每两个点之间，再绘制一个点，代表边的控制器
    for (let i = 0; i < this.getData().points.length - 1; i++) {
      const p1 = this.getData().points[i]
      const p2 = this.getData().points[i + 1]
      const midX = (p1.x + p2.x) / 2
      const midY = (p1.y + p2.y) / 2
      const dist = Math.hypot(x - midX, y - midY)
      if (dist < this.getData().thickness / 4) {
        this.prePointStartPosition = p1;
        this.nextPointStartPosition = p2;

        return {
          id: data.id,
          type: this.type,
          index: i * 2 + 1,
          dist,
        }
      }
    }
    return null
  }

  matchHandelMoveCallback(position: {
    x: number,
    y: number,
    startX?: number,
    startY?: number,
  }, matchHandelInfo: HandelInfo) {
    const { x, y, startX, startY } = position
    if (matchHandelInfo.index !== undefined) {
      this.remove3DCache()
      if (matchHandelInfo.index % 2 === 0) {
        // 拖拽点
        const index = matchHandelInfo.index / 2;
        // 判断有没有非法角度
        const wall = this.getData();
        if (wall.points && wall.points.length >= 2) {
          // 绘制墙上的点
          const pointsBack: { x: number, y: number }[] = [...wall.points]
          pointsBack[index] = { x, y }

          for (let i = 0; i < pointsBack.length; i++) {
            if (i > 0 && i < pointsBack.length - 1) {
              const prev = pointsBack[i - 1]
              const current = pointsBack[i]
              const next = pointsBack[i + 1]
              const angleResult = calculateAngle(prev, current, next)

              if (angleResult) {
                const { angle } = angleResult
                if (angle < 5) {
                  // 计算prev到current的角度
                  // const anglePrevToCurrent = Math.atan2(current.y - prev.y, current.x - prev.x);
                  // console.log('角度角度', anglePrevToCurrent)
                  // const limitAngel = anglePrevToCurrent - 30 * Math.PI / 180;

                  // // 从next点做一条角度为limitAngel的直线
                  // // 计算点{x, y}到这条直线的投影点
                  // const cos = Math.cos(limitAngel);
                  // const sin = Math.sin(limitAngel);
                  // const dx = x - next.x;
                  // const dy = y - next.y;
                  // const t = dx * cos + dy * sin;
                  // const projectionX = next.x + t * cos;
                  // const projectionY = next.y + t * sin;
                  // // const newPoint = { x: projectionX, y: projectionY };
                  // this.getData().points[index] = { x: projectionX, y: projectionY, snw: this.getData().points[index].snw, }

                  return;
                }
              }
            }
          }
        }
        this.getData().points[index] = {
          x,
          y,
          z: this.getData().points[index].z,
        }
      } else {
        // 拖拽线
        if (startX !== undefined && startY !== undefined) {
          const diffMouseX = x - startX
          const diffMouseY = y - startY
          const preIndex = (matchHandelInfo.index - 1) / 2;
          const nextIndex = (matchHandelInfo.index + 1) / 2;
          if (this.prePointStartPosition && this.nextPointStartPosition) {
            this.getData().points[preIndex] = {
              x: this.prePointStartPosition.x + diffMouseX,
              y: this.prePointStartPosition.y + diffMouseY,
              z: this.getData().points[preIndex].z,
            }
            this.getData().points[nextIndex] = {
              x: this.nextPointStartPosition.x + diffMouseX,
              y: this.nextPointStartPosition.y + diffMouseY,
              z: this.getData().points[nextIndex].z,
            }
            console.log('移动边', startX, startY)
          }
        }
      }
    }
  }

  // remove3DCache() {
  //   console.log('remove3DCache---wall')
  //   super.remove3DCache()
  // }

  inSceneSnapPointArea(
    newPosition: MatchSnapPoint,
    dragHandelInfo: HandelInfo
  ) {
    if (newPosition.snapFromType === 'point') {
      // 暂时没有考虑好怎么写磁吸到边的情况，因为暂时无法排除自己，所以只命中point磁吸
      // console.log('MatchSnapPoint-3', newPosition.point, dragHandelInfo.index)
      if (dragHandelInfo.index % 2 === 0) {
        // 和自己排除的逻辑，总是写不好，所以暂时注销掉。
        // const index = dragHandelInfo.index / 2;
        // console.log('newPosition', index, (newPosition.point as PointWithIndex))
        // if ((newPosition.point as PointWithIndex).index && index !== (newPosition.point as PointWithIndex).index) {
        //   this.getData().points[index] = {
        //     x: newPosition.point.x,
        //     y: newPosition.point.y,
        //     snw: this.getData().points[index].snw,
        //   }
        //   return true
        // }
      }
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

  inSceneSnapLineArea() {
    return false;
  }

  setPrepareState(): void {
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void, close: () => void): void {
    const data = this.getData();
    const wallBaseConfig: editItem[] = [
      {
        id: 'thickness',
        label: '墙体厚度',
        dataType: 'number',
        min: 0,
        max: Infinity,
        step: 1,
        value: data.thickness,
        unit: 'cm',
      },
      {
        id: 'color',
        label: '墙体颜色',
        dataType: 'color',
        value: data.color,
      },
      {
        id: 'wmt',
        label: '墙体材质',
        dataType: 'material',
        value: data.wmt,
      },
    ];
    if (snapPoint.index % 2 === 0) {
      const configList: editItem[] = [...wallBaseConfig]
      const pointIndex = snapPoint.index / 2;
      editShow([
        {
          id: 'title',
          label: '顶点属性',
          dataType: 'title',
        },
        {
          id: 'z',
          label: '顶点高度',
          dataType: 'number',
          min: -300,
          max: 300,
          step: 1,
          value: data.points[snapPoint.index / 2].z,
          unit: 'cm',
        },
        {
          id: 'delete',
          label: '删除顶点',
          dataType: 'button',
          value: () => {
            if (data.points.length > 2) {
              const index = snapPoint.index / 2;
              this.setData({
                ...data,
                points: [...data.points.slice(0, index), ...data.points.slice(index + 1)],
              })
              close()
            } else {
              message.error('至少保留两个顶点')
            }
          },
        },
        {
          id: 'title',
          label: '整个墙体属性',
          dataType: 'title',
        },
        ...configList,
      ], (val) => {
        const points = [...data.points]
        points[pointIndex] = {
          ...points[pointIndex],
          z: val.z,
        };
        const saveVal = { ...val }
        delete saveVal.z;
        this.setData({
          ...data,
          ...saveVal,
          points,
        })
      })
    } else {
      const pointIndex = (snapPoint.index - 1) / 2;
      editShow([
        {
          id: 'title',
          label: '墙面属性',
          dataType: 'title',
        },
        {
          id: 'title',
          label: '整个墙体属性',
          dataType: 'title',
        },
        ...wallBaseConfig
      ], (val) => {
        const points = [...data.points]
        points[pointIndex] = {
          ...points[pointIndex],
        };
        const saveVal = { ...val }
        delete saveVal.hidden
        this.setData({
          ...data,
          ...saveVal,
          points,
        })
      })
    }
  }
}

const defaultStaircaseData: StaircaseData = {
  id: Date.now().toString(),
  color: '#fff',
  wmt: 0,
  points: [],
  thickness: 100,
}

export {
  defaultStaircaseData
};
