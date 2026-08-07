import * as THREE from 'three'
import { Point, HandelInfo } from '@/types/map2d'
import { WallData, WallPoint } from './index.d'
import { createAllWallFromPoints } from '@/utils/createAllWallFromPoints'
import { editItem } from '@/utils/editItem'
import { getMaterialById } from '@/material'
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea'
import { calculateAngle } from '@/utils/calculateAngle'
import message from '@/utils/message'
import { isPointInRotatedRect } from '@/utils/isPointInRotatedRect'
import { allSnapFromType, MatchSnapPoint, OrigionSnapPoint } from '@/types/baseEntity'
import { LineEntityClass } from '@/types/lineEntity'
import { GroupBaseEntity } from '@/types/groupBase/entity'
import { GroupBaseData } from '@/types/groupBase'

export class WallEntity extends LineEntityClass<WallPoint, WallData> {
  name: string = '墙'
  type: string = 'wall'
  private circleRadius = 6

  constructor(world: GroupBaseEntity<GroupBaseData>, data: WallData) {
    if (data.cornerType === undefined) {
      data.cornerType = 1
    }
    super(world, data);
  }

  draw2DPreview(ctx: CanvasRenderingContext2D, zoomLevel: number): void {
    const data = this.getData();
    const { points, thickness, cornerType, hb, bc, color } = data;
    if (hb) {
      ctx.strokeStyle = 'black'
      ctx.fillStyle = bc
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      for (let i = 0; i < points.length; i++) {
        const point = points[i]
        const screenX = (point.x + this.offset.x) * zoomLevel;
        const screenY = (point.y + this.offset.y) * zoomLevel;
        if (i === 0) {
          ctx.moveTo(screenX, screenY)
        } else {
          ctx.lineTo(screenX, screenY)
        }
      }
      ctx.stroke()
      ctx.fill()
      ctx.setLineDash([])
    }
    const pointsTemp = [...points];
    const isEndByStart = points.length > 2 && points[0].x === points[points.length - 1].x && points[0].y === points[points.length - 1].y;// 是否首尾衔接
    // 如果首尾衔接，需要处理拐角，两头各自增加一个点，这样会多绘制两个面，生成完成后，再把多生成的两个面裁切掉
    if (isEndByStart) {
      pointsTemp.unshift({
        x: points[points.length - 2].x,
        y: points[points.length - 2].y,
        snw: points[points.length - 1].snw
      })
      pointsTemp.push({
        x: points[1].x,
        y: points[1].y,
        snw: points[1].snw
      })
    }
    const { data: wallBoxList, countPerPoint: countPerPointPerPoint } = createAllWallFromPoints(pointsTemp, thickness, cornerType)

    if (isEndByStart) {
      wallBoxList.shift() // wallBoxList去掉第一个元素
      wallBoxList.pop() // wallBoxList去掉最后一个
    }
    // alert(wallBoxList.length)
    ctx.strokeStyle = 'black'
    ctx.fillStyle = color
    ctx.lineWidth = 3
    ctx.setLineDash([])

    for (let i = 0; i < wallBoxList.length; i++) {
      const box = wallBoxList[i]

      // if (i % countPerPointPerPoint === 0 && points[i / countPerPointPerPoint].snw) {
      //   ctx.setLineDash([10 * zoomLevel, 10 * zoomLevel])
      // } else {
      //   ctx.setLineDash([])
      // }

      ctx.beginPath()
      for (let j = 0; j < box.length; j++) {
        const screenX = (box[j].x + this.offset.x) * zoomLevel
        const screenY = (box[j].y + this.offset.y) * zoomLevel
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

  draw2DActionHandle(
    ctx: CanvasRenderingContext2D,
    zoomLevel: number,
  ): void {
    const data = this.getData();
    const { points, thickness, cornerType, color } = data;
    // 用红色绘制墙
    const { data: wallBoxList, countPerPoint: countPerPointPerPoint } = createAllWallFromPoints(points, thickness + 1, cornerType)
    ctx.strokeStyle = 'red'
    ctx.fillStyle = color
    ctx.lineWidth = 1
    ctx.setLineDash([])

    for (let i = 0; i < wallBoxList.length; i++) {
      const box = wallBoxList[i]

      if (i % countPerPointPerPoint === 0 && points[i / countPerPointPerPoint].snw) {
        ctx.setLineDash([10 * zoomLevel, 10 * zoomLevel])
      } else {
        ctx.setLineDash([])
      }

      ctx.beginPath()
      for (let j = 0; j < box.length; j++) {
        const screenX = box[j].x * zoomLevel
        const screenY = box[j].y * zoomLevel
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

    if (points && points.length >= 2) {
      // 绘制墙上的点
      ctx.lineWidth = 3
      points.forEach((point: Point, index: number) => {
        ctx.strokeStyle = 'red'
        ctx.fillStyle = 'white'
        const screenX = point.x * zoomLevel
        const screenY = point.y * zoomLevel
        ctx.beginPath()
        ctx.arc(screenX, screenY, this.circleRadius * zoomLevel + 3, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fill()
        ctx.closePath()
        if (index > 0 && index < points.length - 1) {
          const prev = points[index - 1]
          const next = points[index + 1]
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
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i]
        const p2 = points[i + 1]
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2
        const screenX = midX * zoomLevel
        const screenY = midY * zoomLevel
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
    const { points, thickness, cornerType } = data;
    const wallHeight = data.height
    const bottom = data.bottom || 0
    const pointsTemp = [...points];
    const isEndByStart = points.length > 2 && points[0].x === points[points.length - 1].x && points[0].y === points[points.length - 1].y;// 是否首尾衔接
    // 如果首尾衔接，需要处理拐角，两头各自增加一个点，这样会多绘制两个面，生成完成后，再把多生成的两个面裁切掉
    if (isEndByStart) {
      pointsTemp.unshift({
        x: points[points.length - 2].x,
        y: points[points.length - 2].y,
        snw: points[points.length - 1].snw
      })
      pointsTemp.push({
        x: points[1].x,
        y: points[1].y,
        snw: points[1].snw
      })
    }
    const { data: wallBoxList, countPerPoint: countPerPointPerPoint } = createAllWallFromPoints(pointsTemp, thickness, cornerType);
    if (isEndByStart) {
      wallBoxList.shift() // wallBoxList去掉第一个元素
      wallBoxList.pop() // wallBoxList去掉最后一个
    }
    const extrudeSettings = {
      steps: 1,
      depth: wallHeight,
      bevelEnabled: true,
    }
    for (let i = 0; i < wallBoxList.length; i++) {
      const box = wallBoxList[i]

      const wallItemPoints = [];
      for (let j = 0; j < box.length; j++) {
        wallItemPoints.push(new THREE.Vector2(box[j].x, box[j].y * -1))
      }
      if (wallItemPoints.length) {
        const shape = new THREE.Shape(wallItemPoints)
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
        if (i % countPerPointPerPoint === 0 && data.points[i / countPerPointPerPoint].snw) {
          wallMesh.visible = false
        }
        // wallMesh.position.set(0, 0, 0)
        // console.log('this.getData() ', this.getData())
        wallMesh.castShadow = true
        wallMesh.receiveShadow = true
        wallMesh.position.setY(bottom)
        const group = new THREE.Group()
        group.add(wallMesh)
        // @ts-ignore
        group.isWall = true
        meshList.push(group)
      }
    }

    const planePoints: THREE.Vector2[] = []; // wall.points.map((p) => new THREE.Vector2(p.x, p.y))
    data.points.forEach((mesh: Point) => {
      planePoints.push(new THREE.Vector2(mesh.x, mesh.y * -1))
    })
    if (planePoints.length) {
      const shape = new THREE.Shape(planePoints)
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
        floorMesh.position.set(0, floorDepth * -1 + 1 + bottom, 0)
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
        topMesh.position.set(0, wallHeight + 1 + bottom, 0)
        const group2 = new THREE.Group()
        group2.add(topMesh)
        meshList.push(group2)
      }
    }
    return meshList
  }

  showMatchHandel(x: number, y: number) {
    const data = this.getData();
    const { points } = data;
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      const dist = Math.hypot(x - point.x, y - point.y)
      if (dist < Math.max(this.getData().thickness, 3)) {
        return new MatchCircleArea({
          x: point.x,
          y: point.y,
          r: this.getData().thickness,
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
        angleY: angel * -1,
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
      if (dist < Math.max(this.getData().thickness, 3)) {
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
      if (dist < this.getData().thickness / 2) {
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

        const oldPoints = [...this.getData().points]
        oldPoints[index] = {
          x: Math.round(x),
          y: Math.round(y),
          snw: this.getData().points[index].snw
        }
        this.setData({
          // ...this.getData(),
          points: oldPoints,
        })
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
      if (dragHandelInfo.type === 'wall' && 'index' in newPosition.point) {
        if (dragHandelInfo.index % 2 === 0) {
          const index = dragHandelInfo.index / 2;
          this.getData().points[index] = {
            x: newPosition.point.x,
            y: newPosition.point.y,
            snw: this.getData().points[index].snw,
          }
          return true
        }
      }
    }
    return false;
  }

  // 本对象可以被其他对象对齐参考点（注意是被对齐，提供给其他拖动磁吸的参考点）
  getMineBeSnapPoints(matchedHandelInfo: HandelInfo): Array<OrigionSnapPoint> {
    const key: allSnapFromType = 'point';
    const data = this.getData();
    let allSnapPoints = this.getData().points.map((v: Point, index: number) => {
      return {
        objType: this.type,
        snapFromType: key,
        point: { ...v, index },
      }
    })
    if (matchedHandelInfo.id === data.id) {
      allSnapPoints = allSnapPoints.filter(v => {
        if (v.snapFromType === 'point' && v.point.index === matchedHandelInfo?.index / 2) {
          return false;
        }
        return true;
      })
    }
    return allSnapPoints;
  }

  // 本对象可以被其他对象对齐的参考线（注意是被对齐，提供个其他拖动磁吸的参考线）
  getMineBeSnapLines(): Array<[Point, Point]> {
    const lines: Array<[Point, Point]> = []
    for (let i = 0; i < this.getData().points.length - 1; i++) {
      const p1 = this.getData().points[i]
      const p2 = this.getData().points[i + 1]
      lines.push([p1, p2])
    }
    return lines;
  }

  getEditPropConfigData(data: WallData): editItem[] {
    return [
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
        id: 'height',
        label: '墙体高度',
        dataType: 'number',
        min: 1,
        max: Infinity,
        step: 1,
        value: data.height,
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
      {
        id: 'hb',
        label: '是否有地板',
        dataType: 'boolean',
        value: data.hb,
      },
      {
        id: 'bc',
        label: '地板颜色',
        dataType: 'color',
        value: data.bc,
      },
      {
        id: 'bmt',
        label: '地板材质',
        dataType: 'material',
        value: data.bmt,
      },
      {
        id: 'ht',
        label: '是否有天花板',
        dataType: 'boolean',
        value: data.ht,
      },
      {
        id: 'tc',
        label: '天花板颜色',
        dataType: 'color',
        value: data.tc,
      },
      {
        id: 'tmt',
        label: '天花板材质',
        dataType: 'material',
        value: data.tmt,
      },
      {
        id: 'td',
        label: '天花板是否是双面',
        dataType: 'boolean',
        value: data.td,
      },
      {
        id: 'bottom',
        label: '距离地面距离',
        dataType: 'number',
        min: -500,
        max: 500,
        step: 1,
        value: data.bottom,
        unit: 'cm',
      },
      {
        id: 'cornerType',
        label: '转角类型',
        dataType: 'cornerType',
        value: data.cornerType,
        panelDesc: '某些角类型3D渲染是一致的，但是区分“独立墙蹲”，区别在于隐藏墙的时候，独立墙蹲不会隐藏。',
      }
    ];
  }

  editPropConfig(snapPoint: HandelInfo, editShow: (editInfoList: editItem[], callback: (val: any) => void) => void, close: () => void): void {
    const data = this.getData();
    const wallBaseConfig: editItem[] = this.getEditPropConfigData(data)
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
                // ...data,
                points: [...data.points.slice(0, index), ...data.points.slice(index + 1)],
              })
              close()
            } else {
              message.error('至少保留两个顶点')
            }
          },
        },
        {
          id: 'split',
          label: '从此顶点断成两截',
          dataType: 'button',
          value: async () => {
            if (!this.parentEntity) {
              message.error('请先添加到场景中')
              return;
            }
            if (data.points.length > 2) {
              const index = snapPoint.index / 2;
              if (index === 0) {
                message.error('只能从中间节点断开')
                return;
              }
              if (index === data.points.length - 1) {
                message.error('只能从中间节点断开')
                return;
              }
              const wall1Points = [...data.points.slice(0, index + 1)]
              const wall2Points = [...data.points.slice(index)]
              // 克隆出一个新的墙
              const type = this.type;
              const values = JSON.parse(JSON.stringify(this.getData()));
              values.id = Date.now().toString()
              const apiList = await this.parentEntity.add(type, [values])
              const beCopyEntity = apiList[0]
              beCopyEntity.setData({
                ...values,
                points: [...wall2Points],
              })
              this.setData({
                ...data,
                points: [...wall1Points],
              })
              close()
            } else {
              message.error('只能从中间节点断开')
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
        this.markObjectIsDirty()
        this.setData({
          // ...data,
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
          id: 'hidden',
          label: '隐藏墙',
          dataType: 'boolean',
          value: data.points[pointIndex].snw,
        },
        {
          id: 'delete',
          label: '插入顶点',
          dataType: 'button',
          value: () => {
            const index = (snapPoint.index + 1) / 2;
            console.log('index', index)
            this.setData({
              // ...data,
              points: [
                ...data.points.slice(0, index),
                {
                  x: (data.points[index - 1].x + data.points[index].x) / 2,
                  y: (data.points[index - 1].y + data.points[index].y) / 2,
                  snw: false,
                },
                ...data.points.slice(index)
              ],
            })
            close()
          },
        },
        {
          id: 'title',
          label: '整个墙体属性',
          dataType: 'title',
        },
        ...wallBaseConfig
      ], (val) => {
        this.markObjectIsDirty()
        const points = [...data.points]
        points[pointIndex] = {
          ...points[pointIndex],
          snw: val.hidden,
        };
        const saveVal = { ...val }
        delete saveVal.hidden
        this.setData({
          // ...data,
          ...saveVal,
          points,
        })
      })
    }
  }
}
