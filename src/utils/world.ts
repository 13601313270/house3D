import * as THREE from 'three'
import { Entity, EntityType, Point } from '../types'
import { Door } from '@/entities/door/index.d'
import { Window } from '@/entities/window/index.d'
import { WallEntity } from '@/entities/wall/index'
import { DoorEntity } from '@/entities/door/index'
import { WindowEntity } from '@/entities/window'
import { drawPoint } from './drawPoint'
import { calculateAngle } from './calculateAngle'
import { CameraData } from '@/entities/camera/index.d'
import { CameraEntity } from '@/entities/camera'
import { allFileKeys, defaultFileData, fileData, fileDataKeyToClass } from '@/entities/index'
import { EntityClass } from '@/types/entity'

export const canvasHeight = 600
export const snapThreshold = 20

export class World {
  private allFileObjects: fileData = defaultFileData()

  allFileMapObjects: {
    wall: WallEntity[],
    door: DoorEntity[],
    window: WindowEntity[],
    camera: CameraEntity[],
  } = {
      wall: [],
      door: [],
      window: [],
      camera: [],
    }

  scene: THREE.Scene

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xf0f0f0)
  }

  draw2D(
    canvasRef: HTMLCanvasElement | null,
    tempWallPoints: Point[],
    hoverPoint: Point | null,
    currentTool: string,
    xAxisSnappedY: number | null,
    yAxisSnappedX: number | null,
    panOffset: Point = { x: 0, y: 0 },
    canvasWidth: number = 800,
    canvasHeight: number = 600,
    zoomLevel: number = 1,
    insertTempDoor: Door | null = null,
    insertTempWindow: Window | null = null,
    insertTempCamera: CameraData | null = null
  ) {
    if (!canvasRef) return
    const ctx = canvasRef.getContext('2d')
    if (!ctx) return

    const fileData = this.allFileObjects

    const { wall: walls, door: doors, window: windows, camera: cameras } = fileData
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    // 绘制墙体
    walls.forEach((wall, index) => {
      const wallApi: WallEntity = this.allFileMapObjects.wall[index]
      if (wallApi) {
        wallApi.draw2D(ctx, panOffset, zoomLevel)
      }
    })

    if (currentTool === 'wall' && tempWallPoints.length > 0) {
      ctx.strokeStyle = '#42b983'
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(tempWallPoints[0].x * zoomLevel + panOffset.x, tempWallPoints[0].y * zoomLevel + panOffset.y)
      for (let i = 1; i < tempWallPoints.length; i++) {
        ctx.lineTo(tempWallPoints[i].x * zoomLevel + panOffset.x, tempWallPoints[i].y * zoomLevel + panOffset.y)
      }
      if (hoverPoint) {
        ctx.lineTo(hoverPoint.x * zoomLevel + panOffset.x, hoverPoint.y * zoomLevel + panOffset.y)
      }
      ctx.stroke()

      tempWallPoints.forEach((point, index) => {
        const screenX = point.x * zoomLevel + panOffset.x
        const screenY = point.y * zoomLevel + panOffset.y
        const isDragged = false;// index === draggedPointIndex
        drawPoint(ctx, screenX, screenY, isDragged ? '#1890ff' : '#42b983')
        if (isDragged) {
          ctx.strokeStyle = '#1890ff'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(screenX, screenY, 12 * zoomLevel, 0, Math.PI * 2)
          ctx.stroke()
        }
        if (index > 0) {
          const prev = tempWallPoints[index - 1]
          const prevScreenX = prev.x * zoomLevel + panOffset.x
          const prevScreenY = prev.y * zoomLevel + panOffset.y
          ctx.fillStyle = isDragged ? '#1890ff' : '#42b983'
          ctx.font = '12px Arial'
          const dist = Math.round(Math.hypot(point.x - prev.x, point.y - prev.y))
          const midX = (screenX + prevScreenX) / 2
          const midY = (screenY + prevScreenY) / 2
          ctx.fillText(`${dist}px`, midX, midY - 5)

          // 绘制角度标记
          if (index > 1) {
            const prev2 = tempWallPoints[index - 2]
            const prev2ScreenX = prev2.x * zoomLevel + panOffset.x
            const prev2ScreenY = prev2.y * zoomLevel + panOffset.y
            const angleResult = calculateAngle({ x: prev2ScreenX, y: prev2ScreenY }, { x: prevScreenX, y: prevScreenY }, { x: screenX, y: screenY })
            if (angleResult !== null) {
              const { angle } = angleResult
              const angleText = `${Math.round(angle)}°`
              // 计算角度文本位置：在夹角内侧
              // 如果夹角太小（< 30度），显示在外侧；否则显示在内侧
              const offset = angle < 30 ? 15 : -15
              const angleX = prevScreenX - 10
              const angleY = prevScreenY + offset
              ctx.fillStyle = '#42b983'
              ctx.fillText(angleText, angleX, angleY)
            }
          }
        }
      })

      if (hoverPoint) {
        const hoverScreenX = hoverPoint.x * zoomLevel + panOffset.x
        const hoverScreenY = hoverPoint.y * zoomLevel + panOffset.y
        drawPoint(ctx, hoverScreenX, hoverScreenY, '#42b983')
        // 绘制最后一个转角的角度标记
        if (tempWallPoints.length > 1) {
          const last = tempWallPoints[tempWallPoints.length - 1]
          const lastScreenX = last.x * zoomLevel + panOffset.x
          const lastScreenY = last.y * zoomLevel + panOffset.y
          const angleResult = calculateAngle({ x: lastScreenX, y: lastScreenY }, { x: lastScreenX, y: lastScreenY }, { x: hoverScreenX, y: hoverScreenY })
          if (angleResult !== null) {
            const { angle } = angleResult
            const angleText = `${Math.round(angle)}°`
            // 计算角度文本位置：在夹角内侧
            // 如果夹角太小（< 30度），显示在外侧；否则显示在内侧
            const offset = angle < 30 ? 15 : -15
            const angleX = lastScreenX - 10
            const angleY = lastScreenY + offset
            ctx.fillText(angleText, angleX, angleY)
          }
        }
      }
    }

    const allDoors = [...doors];
    if (currentTool === 'door' && hoverPoint) {
      if (insertTempDoor) {
        allDoors.push(insertTempDoor)
      }
    }
    allDoors.forEach((door, index) => {
      // @ts-ignore
      const doorApi: DoorEntity = this.allFileMapObjects.door[index];
      if (doorApi) {
        const wallThickness = walls.find((wall) => wall.id === door.wallId)?.thickness || 0;
        doorApi.draw2D(ctx, panOffset, wallThickness, zoomLevel)
      }
    })

    const allWindows = [...windows];
    if (currentTool === 'window' && hoverPoint) {
      if (insertTempWindow) {
        allWindows.push(insertTempWindow)
      }
    }

    allWindows.forEach((win, index) => {
      const windowApi: WindowEntity = this.allFileMapObjects.window[index] as WindowEntity;
      const wallThickness = walls.find((wall) => wall.id === win.wallId)?.thickness || 0;
      windowApi.draw2D(ctx, panOffset, wallThickness, zoomLevel)
    })

    const allCameras = [...cameras];
    if (currentTool === 'camera') {
      if (insertTempCamera) {
        allCameras.push(insertTempCamera)
      }
    }
    allCameras.forEach((camera, index) => {
      const cameraApi: CameraEntity = this.allFileMapObjects.camera[index] as CameraEntity;
      cameraApi.draw2D(ctx, panOffset, zoomLevel)
    })

    // 绘制坐标轴
    drawAxes(ctx, panOffset, zoomLevel, canvasWidth, canvasHeight)

    // 绘制轴对齐参考线
    if (hoverPoint) {
      // const hoverScreenX = hoverPoint.x * zoomLevel + panOffset.x
      // const hoverScreenY = hoverPoint.y * zoomLevel + panOffset.y
      ctx.strokeStyle = '#999'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])

      // 垂直线（y轴对齐）
      if (yAxisSnappedX !== null) {
        const screenX = yAxisSnappedX * zoomLevel + panOffset.x
        ctx.beginPath()
        ctx.moveTo(screenX, 0)
        ctx.lineTo(screenX, canvasHeight)
        ctx.stroke()
      }

      // 水平线（x轴对齐）
      if (xAxisSnappedY !== null) {
        const screenY = xAxisSnappedY * zoomLevel + panOffset.y
        ctx.beginPath()
        ctx.moveTo(0, screenY)
        ctx.lineTo(canvasWidth, screenY)
        ctx.stroke()
      }
    }
  }

  draw3D() {
    const { scene } = this;
    allFileKeys.forEach((key) => {
      (this.allFileMapObjects[key] as EntityClass<any>[]).forEach((wall) => {
        wall.draw3DAndCache(scene)
      });
    });
  }

  getAllFileObjects() {
    return this.allFileObjects
  }

  getObjects(type: EntityType) {
    return [...this.allFileObjects[type]]
  }

  add(type: EntityType, data: Entity[]) {
    const EntityClassItem: EntityClass<any> = fileDataKeyToClass[type] as any;
    for (let i = 0; i < data.length; i++) {
      this.allFileObjects[type].push(data[i] as any)
      // @ts-ignore
      const api: EntityClass<any> = new EntityClassItem(this, data[i]);
      // @ts-ignore
      this.allFileMapObjects[type].push(api)
    }
  }

  clear(type: EntityType) {
    this.allFileObjects[type] = []
    this.allFileMapObjects[type] = []
  }

  splice(type: EntityType, index: number, count: number = 1) {
    if (this.allFileObjects[type]) {
      this.allFileObjects[type].splice(index, count)
      this.allFileMapObjects[type].splice(index, count)
    }
  }
}

const drawAxes = (
  ctx: CanvasRenderingContext2D,
  panOffset: Point,
  zoomLevel: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  const axisColor = '#333'
  const axisLineWidth = 2
  const tickSize = 5
  const labelPadding = 15
  const scale = 100

  const originX = panOffset.x
  const originY = panOffset.y

  ctx.strokeStyle = axisColor
  ctx.lineWidth = axisLineWidth
  ctx.fillStyle = axisColor
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 绘制x轴
  ctx.beginPath()
  ctx.moveTo(0, originY)
  ctx.lineTo(canvasWidth, originY)
  ctx.stroke()

  // 绘制x轴箭头
  const arrowSize = 8
  ctx.beginPath()
  ctx.moveTo(canvasWidth, originY)
  ctx.lineTo(canvasWidth - arrowSize, originY - arrowSize / 2)
  ctx.lineTo(canvasWidth - arrowSize, originY + arrowSize / 2)
  ctx.closePath()
  ctx.fill()

  // x轴刻度和标签
  const startX = Math.floor((0 - panOffset.x) / scale) * scale
  const endX = Math.ceil((canvasWidth - panOffset.x) / scale) * scale

  for (let x = startX; x <= endX; x += scale) {
    const screenX = x * zoomLevel + panOffset.x
    if (screenX >= 0 && screenX <= canvasWidth) {
      ctx.beginPath()
      ctx.moveTo(screenX, originY - tickSize)
      ctx.lineTo(screenX, originY + tickSize)
      ctx.stroke()

      const label = x !== 0 ? `${x}px` : 'O'
      ctx.fillStyle = axisColor
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(label, screenX, originY + labelPadding)
    }
  }

  // 绘制y轴
  ctx.strokeStyle = axisColor
  ctx.lineWidth = axisLineWidth
  ctx.fillStyle = axisColor
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX, canvasHeight)
  ctx.stroke()

  // 绘制y轴箭头
  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX - arrowSize / 2, arrowSize)
  ctx.lineTo(originX + arrowSize / 2, arrowSize)
  ctx.closePath()
  ctx.fill()

  // y轴刻度和标签
  const startY = Math.floor((0 - panOffset.y) / scale) * scale
  const endY = Math.ceil((canvasHeight - panOffset.y) / scale) * scale

  for (let y = startY; y <= endY; y += scale) {
    const screenY = y * zoomLevel + panOffset.y
    if (screenY >= 0 && screenY <= canvasHeight) {
      ctx.beginPath()
      ctx.moveTo(originX - tickSize, screenY)
      ctx.lineTo(originX + tickSize, screenY)
      ctx.stroke()

      const label = y !== 0 ? `${y}px` : 'O'
      ctx.fillStyle = axisColor
      ctx.font = '10px Arial'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, originX - labelPadding, screenY)
    }
  }

  // 绘制原点标签
  ctx.fillStyle = axisColor
  ctx.font = '10px Arial'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText('O', originX - labelPadding, originY + labelPadding)
}
