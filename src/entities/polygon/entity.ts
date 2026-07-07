import { Point, HandelInfo } from '@/types/map2d'
import { createAllWallFromPoints } from '@/utils/createAllWallFromPoints'
import * as THREE from 'three'
import { editItem } from '..'
import { getMaterialById } from '@/material'
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea'
import { calculateAngle } from '@/utils/calculateAngle'
import message from '@/utils/message'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { allSnapFromType, MatchSnapPoint } from '@/types/baseEntity'
import { LineEntityClass } from '@/types/lineEntity'
import { World } from '@/utils/world'
import { PolygonPoint, PolygonData } from './index.d'

export class PolygonEntity extends LineEntityClass<PolygonPoint, PolygonData> {
  name: string = '折线体'
  type: string = 'polygon'
  isPointObj: boolean = false
  private circleRadius = 6
  private thickness = 10

  // constructor(world: World, data: PolygonData) {
  //   super(world, data);
  //   // if (this.data.cornerType === undefined) {
  //   //   this.data.cornerType = 1
  //   // }
  // }

  draw2DPreviewByData(ctx: CanvasRenderingContext2D, data: PolygonData, panOffset: Point, zoomLevel: number): void {
    ctx.strokeStyle = 'black'
    ctx.fillStyle = data.color
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < data.points.length; i++) {
      const point = data.points[i]
      const screenX = (point.x + this.offset.x) * zoomLevel + panOffset.x;
      const screenY = (point.y + this.offset.y) * zoomLevel + panOffset.y;
      if (i === 0) {
        ctx.moveTo(screenX, screenY)
      } else {
        ctx.lineTo(screenX, screenY)
      }
    }
    if (data.points.length >= 2) {
      ctx.lineTo(
        (data.points[0].x + this.offset.x) * zoomLevel + panOffset.x,
        (data.points[0].y + this.offset.y) * zoomLevel + panOffset.y
      )
    }
    ctx.stroke()
    ctx.fill()
  }

  draw2DByData(
    ctx: CanvasRenderingContext2D,
    data: PolygonData,
    panOffset: Point,
    zoomLevel: number,
  ): void {
    if (data.points && data.points.length > 2) {
      // 绘制墙上的点
      ctx.lineWidth = 3
      data.points.forEach((point: Point, index: number) => {
        ctx.strokeStyle = 'red'
        ctx.fillStyle = 'white'
        const screenX = point.x * zoomLevel + panOffset.x
        const screenY = point.y * zoomLevel + panOffset.y
        ctx.beginPath()
        ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fill()
        ctx.closePath()
        if (index < data.points.length) {
          const prev = index === 0 ? data.points[data.points.length - 1] : data.points[index - 1]
          const next = index === data.points.length - 1 ? data.points[0] : data.points[index + 1]
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
      for (let i = 0; i < data.points.length; i++) {
        const p1 = data.points[i]
        const p2 = i === data.points.length - 1 ? data.points[0] : data.points[i + 1]
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
    const { z, color, height } = data
    const meshList: THREE.Group[] = []

    const points: THREE.Vector2[] = [];
    data.points.forEach((mesh: Point) => {
      points.push(new THREE.Vector2(mesh.x, mesh.y * -1))
    })
    if (points.length) {
      const shape = new THREE.Shape(points)
      const extrudeSettingsBottom = {
        steps: 1,
        depth: height,
        bevelEnabled: true,
      }
      // alert(height)
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettingsBottom)
      geometry.rotateX(-Math.PI / 2);   // 将 XY 平面旋转成 XZ 平面
      const materialBottom = (new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide
      }));
      const floorMesh = new THREE.Mesh(geometry, materialBottom)
      // floorMesh.position.set(0, height * -1, 0)
      const group = new THREE.Group()
      group.add(floorMesh)
      group.position.setY(z)
      meshList.push(group)
    }
    return meshList
  }

  // createBoundingBox() {
  //   // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  //   // const { r, h } = this.getData();
  //   // 第一个是尺寸，第二个是位置偏移，第三个是旋转角度
  //   return [
  //     new THREE.Vector3(100, 200, 100),
  //     new THREE.Vector3(0, 200 / 2, 0),
  //     new THREE.Vector3(0, 0, 0)
  //   ]
  // }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const { points } = data;
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < Math.max(this.thickness, 3)) {
        return new MatchCircleArea({
          x: point.x,
          y: point.y,
          r: this.thickness,
        })
      }
    }

    // 每两个点之间，再绘制一个点，代表边的控制器
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = i === points.length - 1 ? points[0] : points[i + 1]
      const midX = (p1.x + p2.x) / 2
      const midY = (p1.y + p2.y) / 2
      const width = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      const angel = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      if (isPointInRotatedRect(x, y, {
        x: midX,
        y: midY,
        width,
        depth: this.thickness + 2,
        angleY: angel,
      })) {
        return new MatchRectArea({
          x: midX,
          y: midY,
          width,
          depth: this.thickness + 2,
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
    const { points } = data;
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < Math.max(this.thickness, 3)) {
        return {
          id: data.id,
          type: this.type,
          index: i * 2,
          dist,
        }
      }
    }

    // 每两个点之间，再绘制一个点，代表边的控制器
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i]
      const p2 = i === points.length - 1 ? points[0] : points[i + 1]
      const midX = (p1.x + p2.x) / 2
      const midY = (p1.y + p2.y) / 2
      const dist = Math.hypot(x - midX, y - midY)
      if (dist < this.thickness / 2) {
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
    const {
      x,
      y,
      // startX,
      // startY
    } = position
    if (matchHandelInfo.index !== undefined) {
      this.markObjectIsDirty()
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
                  return;
                }
              }
            }
          }
        }
        this.getData().points[index] = { x, y }
      } else {
        // 拖拽线开启后，墙上的窗户移动的时候，无法被触发，所以关闭掉。
        // if (startX !== undefined && startY !== undefined) {
        //   const diffMouseX = x - startX
        //   const diffMouseY = y - startY
        //   const preIndex = (matchHandelInfo.index - 1) / 2;
        //   const nextIndex = (matchHandelInfo.index + 1) / 2;
        //   if (this.prePointStartPosition && this.nextPointStartPosition) {
        //     this.getData().points[preIndex] = {
        //       x: this.prePointStartPosition.x + diffMouseX,
        //       y: this.prePointStartPosition.y + diffMouseY,
        //       snw: this.getData().points[preIndex].snw,
        //     }
        //     this.getData().points[nextIndex] = {
        //       x: this.nextPointStartPosition.x + diffMouseX,
        //       y: this.nextPointStartPosition.y + diffMouseY,
        //       snw: this.getData().points[nextIndex].snw,
        //     }
        //     console.log('移动边', startX, startY)
        //   }
        // }
      }
    }
  }

  // markObjectIsDirty() {
  //   console.log('markObjectIsDirty---wall')
  //   super.markObjectIsDirty()
  // }

  // 本对象某个HandelInfo进入一个吸附对象的区域
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

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void, close: () => void): void {
    const data = this.getData();
    const wallBaseConfig: editItem[] = [
      // {
      //   id: 'height',
      //   label: '高度',
      //   dataType: 'number',
      //   min: 1,
      //   max: Infinity,
      //   step: 1,
      //   value: data.height,
      //   unit: 'cm',
      // },
      {
        id: 'color',
        label: '颜色',
        dataType: 'color',
        value: data.color,
      },
      {
        id: 'height',
        label: '高度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 1,
        value: data.height,
        unit: 'cm',
      },
      {
        id: 'z',
        label: 'Z轴',
        dataType: 'number',
        min: -Infinity,
        max: Infinity,
        step: 1,
        value: data.z,
        unit: 'cm',
      }
      // {
      //   id: 'cornerType',
      //   label: '转角类型',
      //   dataType: 'cornerType',
      //   value: data.cornerType,
      //   panelDesc: '某些角类型3D渲染是一致的，但是区分“独立墙蹲”，区别在于隐藏墙的时候，独立墙蹲不会隐藏。',
      // }
    ];
    if (snapPoint.index % 2 === 0) {
      const configList: editItem[] = [...wallBaseConfig]
      editShow([
        {
          id: 'title',
          label: '顶点属性',
          dataType: 'title',
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
        // {
        //   id: 'split',
        //   label: '从此顶点断成两截',
        //   dataType: 'button',
        //   value: async () => {
        //     if (data.points.length > 2) {
        //       const index = snapPoint.index / 2;
        //       if (index === 0) {
        //         message.error('只能从中间节点断开')
        //         return;
        //       }
        //       if (index === data.points.length - 1) {
        //         message.error('只能从中间节点断开')
        //         return;
        //       }
        //       const wall1Points = [...data.points.slice(0, index + 1)]
        //       const wall2Points = [...data.points.slice(index)]
        //       // 克隆出一个新的墙
        //       const type = this.type;
        //       const values = JSON.parse(JSON.stringify(this.getData()));
        //       values.id = Date.now().toString()
        //       const apiList = await window.worldApi.add(type, [values])
        //       const beCopyEntity = apiList[0]
        //       beCopyEntity.setData({
        //         ...values,
        //         points: [...wall2Points],
        //       })
        //       this.setData({
        //         ...data,
        //         points: [...wall1Points],
        //       })
        //       close()
        //     } else {
        //       message.error('只能从中间节点断开')
        //     }
        //   },
        // },
        {
          id: 'title',
          label: '整个面属性',
          dataType: 'title',
        },
        ...configList,
      ], (val) => {
        this.markObjectIsDirty()
        this.setData({
          ...data,
          ...val,
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
          id: 'delete',
          label: '插入顶点',
          dataType: 'button',
          value: () => {
            const index = (snapPoint.index + 1) / 2;
            console.log('index', index, data.points.length)
            const prePoint = data.points[index - 1]
            const nextPoint = index === data.points.length ? data.points[0] : data.points[index]
            this.setData({
              ...data,
              points: [
                ...data.points.slice(0, index),
                {
                  x: (prePoint.x + nextPoint.x) / 2,
                  y: (prePoint.y + nextPoint.y) / 2,
                },
                ...data.points.slice(index)
              ],
            })
            close()
          },
        },
        {
          id: 'title',
          label: '整个面属性',
          dataType: 'title',
        },
        ...wallBaseConfig
      ], (val) => {
        this.markObjectIsDirty()
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
