<template>
  <div class="map2d-container">
    <div class="left-panel" :style="{ width: panel1SplitWidthPer * 100 + '%' }">
      <div class="toolbar">
        <div class="toolbar-item">
          <button type="button">
            添加
          </button>
          <div class="list">
            <div>
              <div class="childItem" v-for="value in allFileKeys" :key="value"
                :class="{ active: currentTool === value }" @click="changeCurrentTool(value)">
                {{ allFileKeysName[value] }}
              </div>
            </div>
            <div>
              <div v-for="item in ObjFiles" :key="item.id" class="childItem"
                @click="changeCurrentToolToOutFile(item.id)">
                {{ item.id }}
              </div>
            </div>
          </div>
        </div>
        <button @click="clearDrawing" type="button">
          清空
        </button>
        <button @click="saveDrawing" type="button">
          保存
        </button>
        <button @click="loadDrawing" type="button">
          加载
        </button>
        <input type="file" id="fileInput" ref="fileInputRef" accept=".json" style="display: none"
          @change="handleFileChange" />
        <button :class="{ active: currentTool === 'drag' }" @click="changeCurrentTool('drag')" type="button">
          拖拽
        </button>
        <!-- <input type="number" v-model="wallThickness" placeholder="墙厚度" /> -->
      </div>

      <div class="canvas-container">
        <canvas ref="canvasRef" @click="handleCanvasClick" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
          @mouseup="handleMouseUp" @contextmenu="handleContextMenu" class="drawing-canvas"
          :style="{ display: isSplitting ? 'none' : 'block' }" />
        <div v-if="contextMenu?.visible" class="context-menu"
          :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }">
          <!-- {{ editPropConfigInfo }} -->
          {{ editPropInputInfo }}
          =========
          <div class="configList">
            <div v-for="item in editPropConfigInfo" :key="item.id" class="configItem">
              <div>
                {{ item.label }}：
                <!-- {{ editPropInputInfo[item.id] }} -->
              </div>
              <div>
                <!-- {{ item }} -->
                <DataTypeEdit :item="item" v-model="editPropInputInfo" />
              </div>
            </div>
          </div>
          <button @click="deleteContextMenuEntity">删除</button>
        </div>
      </div>
    </div>

    <div class="split-bar" @mousedown.prevent="startSplit(1)" title="拖动调整左右比例"></div>

    <div class="right-panel" :style="{ width: panel2SplitWidthPer * 100 + '%' }">
      <!-- {{ insertTempDoor }} -->
      <div class="right-panel-content">
        <Canvas3D ref="canvas3DRef" :world="worldApi" v-model:cameraState="cameraState" :aspectRatio="1" />
      </div>
    </div>

    <div class="split-bar" @mousedown.prevent="startSplit(2)" title="拖动调整左右比例"></div>
    <div class="right-panel" :style="{ width: (1 - panel1SplitWidthPer - panel2SplitWidthPer) * 100 + '%' }">
      <div class="tools">
        <div style="flex-shrink: 0;">摄像机：</div>
        <div class="cameraList">
          <div v-for="(item, index) in allCamera" @click="changeCamera2State(index)"
            :class="{ active: activeCameraIndex === index }" class="cameraItem">{{ index }}
          </div>
        </div>
        <div>
          <button type="button">导出图片</button>
        </div>
      </div>
      <div class="right-panel-content">
        <Canvas3D v-if="allCamera.length && cameraState2" ref="canvas3DRef2" :world="worldApi"
          :cameraState="cameraState2" :aspectRatio="cameraState2.aspectW / cameraState2.aspectH" />
        <div v-else class="noCamera">场景中请至少添加一个摄像机</div>
      </div>
    </div>

    <!-- <div class="allMaterialPanel" v-if="allMaterialShow && allMaterialShowPropId"
      @click.self="allMaterialShow = false, allMaterialShowPropId = undefined">
      <div class="allMaterialPanelInner">
        <div class="title">所有材质</div>
        <div class="list">
          <div class="materialItem"
            @click="updateEditPropInputNumberInfo(allMaterialShowPropId, 0), allMaterialShow = false">
            <div class="imgOuting">
              <img src="../assets/Empty.png" alt="noMaterial" class="img"
                style="width: 50px;background-color: white;" />
            </div>
            <div class="name">无</div>
          </div>
          <div v-for="item2 in allMaterial" :key="item2.id" class="materialItem"
            :class="{ active: editPropInputInfo[item2.id] === item2.id }"
            @click="updateEditPropInputNumberInfo(allMaterialShowPropId, item2.id), allMaterialShow = false">
            <div class="imgOuting">
              <img :src="item2.img" alt="material" class="img" />
            </div>
            <div class="name">{{ item2.name }}</div>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ObjData, Point } from '../types'
import { snapThreshold, World } from '../utils/world'
import Canvas3D, { CameraState } from '../components/Canvas3D.vue'
import { WallData } from '@/entities/wall/index.d'
import { allFileKeys, fileData, editItem, allFileKeysName, createInitData, fileDataKeyToClass } from '@/entities'
import { EntityClass, EntityClassInWall, EntityType, MatchSnapPoint } from '@/types/entity'
import { HandelInfo, PointWithIndex } from '@/types/map2d'
import pointToLineDistance from '@/utils/pointToLineDistance'
import { DoorEntity } from '@/entities/door'
import { CameraData } from '@/entities/camera/index.d'
import { WallDataClass, WallEntity } from '@/entities/wall'
import ObjFiles, { ObjItem } from '@/entities/allObjs'
import { OutFileDataClass, OutFileEntity } from '@/entities/outFile'
import { OutFileData } from '@/entities/outFile/index.d'
import DataTypeEdit from './DataTypeEdit.vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvas3DRef = ref<typeof Canvas3D | null>(null)
const canvas3DRef2 = ref<typeof Canvas3D | null>(null)
const currentTool = ref<'wall' | 'door' | 'window' | 'camera' | 'outFile' | 'drag'>('drag')
const tempDrawWall = ref<WallDataClass | null>(null)
const hoverPoint = ref<Point | null>(null)
const lastPoint = ref<Point | null>(null)
const history = ref<WallDataClass[][]>([])
const xAxisSnappedY = ref<{ objType: EntityType; number: number } | null>(null)
const yAxisSnappedX = ref<{ objType: EntityType; number: number } | null>(null)
const draggedPoint = ref<
  { objType: 'wall'; wallIndex: number; pointIndex: number } |
  { type: 'door'; doorIndex: number } |
  { type: 'window'; windowIndex: number } |
  null>(null)
const dragOffset = ref<Point | null>(null)
const dragStartPoint = ref<Point | null>(null)
const panOffset = ref<Point>({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref<Point | null>(null)
const panel1SplitWidthPer = ref(0.4)
const panel2SplitWidthPer = ref(0.4)
const isSplitting = ref(false)
const canvasSize = ref({ width: 0, height: 0 })
const zoomLevel = ref(1)
const wallThickness = ref<number>(20)

const allMaterialShow = ref(false)
const allMaterialShowPropId = ref<string>()

const cameraState = ref<CameraState>({
  targetPositionX: 0,
  targetPositionY: 0,
  targetPositionZ: 0,
  radius: 800,
  angleX: 0,
  angleY: Math.PI / 4,
  aspectW: 1,
  aspectH: 1,
})
const allCamera = ref<CameraState[]>([])
const cameraState2 = ref<CameraState | null>(null)

let insertTempObj: EntityClass<any> | null = null

let panStartScreenX = 0
let panStartScreenY = 0

const updateCanvasSize = () => {
  const container = document.querySelector('.map2d-container')
  if (!container) return

  const canvas = canvasRef.value
  if (canvas) {
    const canvasContainer = document.querySelector('.canvas-container')
    if (canvasContainer) {
      const canvasRect = canvasContainer.getBoundingClientRect()
      const width = Math.floor(canvasRect.width)
      const height = Math.floor(canvasRect.height)
      // console.log('===width---', width)

      if (width > 0 && height > 0) {
        canvas.width = width
        canvas.height = height
        canvasSize.value = { width, height }
      }
    }
  }

  const canvas3DPanel = canvas3DRef.value
  if (canvas3DPanel) {
    canvas3DPanel.resize();
  }
  const canvas3DPanel2 = canvas3DRef2.value
  if (canvas3DPanel2) {
    canvas3DPanel2.resize();
  }
  setTimeout(() => {
    drawWrapper()
  }, 30)
}

// const drawingData = computed<fileData>(() => (worldApi.allFileObjects))

const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  type: 'door' | 'window' | 'wall' | 'camera';
  index?: number;
  wallIndex?: number;
  pointIndex?: number;
  thickness?: number
} | null>(null)

const editPropConfigInfo = ref<editItem[]>([])
const editPropInputInfo = ref<any>({})
const editPropTypeKey = ref<EntityType>()
const editPropTypeIndex = ref<number>(-1)

export interface NearestWallResult {
  wall: WallData
  lineIndex: number,
  pointOnWall: Point
  angle: number
}

const getNearestWall = (point: Point): NearestWallResult | null => {
  let nearestWall: WallData | null = null
  let nearestPoint: Point | null = null
  let minDistance = Infinity
  let nearestAngle = 0
  let lineIndex: number = -1;

  (worldApi.getObjects('wall') as WallData[]).forEach((wall: WallData) => {
    for (let i = 0; i < wall.points.length - 1; i++) {
      const p1 = wall.points[i]
      const p2 = wall.points[i + 1]

      const distance = pointToLineDistance(point, p1, p2)

      if (distance < minDistance) {
        minDistance = distance
        nearestWall = wall
        lineIndex = i;
        nearestPoint = getClosestPointOnLine(point, p1, p2)
        nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
      }
    }
  })

  if (nearestPoint && lineIndex > -1 && minDistance < snapThreshold && nearestWall) {
    return {
      lineIndex,
      wall: nearestWall,
      pointOnWall: nearestPoint,
      angle: nearestAngle
    }
  }

  return null
}

const getClosestPointOnLine = (p: Point, a: Point, b: Point) => {
  const A = p.x - a.x
  const B = p.y - a.y
  const C = b.x - a.x
  const D = b.y - a.y

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  if (param < 0) {
    return { x: a.x, y: a.y }
  } else if (param > 1) {
    return { x: b.x, y: b.y }
  } else {
    return {
      x: a.x + param * C,
      y: a.y + param * D
    }
  }
}

const getSnapPoint = (
  startPoints: Array<MatchSnapPoint>, // 这里的点会计算角度磁吸
  current: Point,
  allPoints: Array<MatchSnapPoint> = [], // 点磁吸和轴磁吸
): MatchSnapPoint | null => {
  // 找到距离 current 最近的 start 点
  let nearestStart: MatchSnapPoint | null = null
  let minDistance = Infinity

  for (const start of startPoints) {
    const dist = Math.hypot(current.x - start.point.x, current.y - start.point.y)
    if (dist < minDistance) {
      minDistance = dist
      nearestStart = start
    }
  }
  // 一、计算三组磁吸数据
  // 计算点磁吸数据
  let pointSnapped: MatchSnapPoint | null = null
  let pointDistance = Infinity

  for (const point of allPoints) {
    const dist = Math.hypot(current.x - point.point.x, current.y - point.point.y)
    // 排除与 nearestStart 完全重合的点
    if (dist < 10 && !(nearestStart && point.point.x === nearestStart.point.x && point.point.y === nearestStart.point.y)) {
      if (dist < pointDistance) {
        pointDistance = dist
        pointSnapped = {
          objType: point.objType,
          objId: point.objId,
          snapFromType: point.snapFromType,
          point: point.point
        }
      }
    }
  }
  // 二、按照优先级依次尝试命中
  // 1. 最高优先级：点磁吸
  if (pointSnapped) {
    return {
      objType: pointSnapped.objType,
      snapFromType: pointSnapped.snapFromType,
      objId: pointSnapped.objId,
      point: {
        ...roundNumberList(pointSnapped.point),
        index: (pointSnapped.point as PointWithIndex).index,
      } as PointWithIndex
    };
  }

  let snappedX = current.x
  let snappedY = current.y

  const snapAngles = [0, 45, 90, 135, 180, -135, -90, -45]

  if (tempDrawWall.value?.points?.length && tempDrawWall.value.points.length > 1) {
    const prev = tempDrawWall.value.points[tempDrawWall.value.points.length - 2]
    const last = tempDrawWall.value.points[tempDrawWall.value.points.length - 1]
    const prevDx = last.x - prev.x
    const prevDy = last.y - prev.y
    const prevAngle = Math.atan2(prevDy, prevDx)
    const prevAngleDeg = prevAngle * 180 / Math.PI

    let perpendicularAngle1 = prevAngleDeg + 90
    let perpendicularAngle2 = prevAngleDeg - 90

    if (perpendicularAngle1 > 180) perpendicularAngle1 -= 360
    if (perpendicularAngle1 < -180) perpendicularAngle1 += 360
    if (perpendicularAngle2 > 180) perpendicularAngle2 -= 360
    if (perpendicularAngle2 < -180) perpendicularAngle2 += 360

    snapAngles.push(perpendicularAngle1, perpendicularAngle2)
  }

  // 2. 第二优先级：角度+轴对齐组合（计算交点）
  // 3. 计算轴对齐磁吸数据
  let xAxisSnappedYVal: {
    objType: EntityType,
    objId: string,
    number: number
  } | null = null // 命中的y坐标值（水平对齐，即y值与某个点一致）
  let yAxisSnappedXVal: {
    objType: EntityType,
    objId: string,
    number: number
  } | null = null // 命中的x坐标值（垂直对齐，即x值与某个点一致）
  let xAxisDistance = Infinity // 命中x轴对齐的最小距离
  let yAxisDistance = Infinity // 命中y轴对齐的最小距离
  for (const point of allPoints) {
    const distToXAxis = Math.abs(current.y - point.point.y)
    if (distToXAxis < 10 && distToXAxis < xAxisDistance) {
      xAxisDistance = distToXAxis
      xAxisSnappedYVal = {
        objType: point.objType,
        objId: point.objId,
        number: point.point.y
      }
    }

    const distToYAxis = Math.abs(current.x - point.point.x)
    if (distToYAxis < 10 && distToYAxis < yAxisDistance) {
      yAxisDistance = distToYAxis
      yAxisSnappedXVal = {
        objType: point.objType,
        objId: point.objId,
        number: point.point.x
      }
    }
  }

  // 更新ref值用于绘制参考线
  xAxisSnappedY.value = xAxisSnappedYVal
  yAxisSnappedX.value = yAxisSnappedXVal

  if (startPoints.length && nearestStart) {
    const dx = current.x - nearestStart.point.x
    const dy = current.y - nearestStart.point.y
    let nearestSnapAngle = 0 // 最近的角度(startPoints里比对)
    let minAngleDiff = 180

    for (const snapAngle of snapAngles) {
      const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI
      let diff = Math.abs(angleDeg - snapAngle)
      if (diff > 180) {
        diff = 360 - diff
      }

      if (diff < minAngleDiff) {
        minAngleDiff = diff
        nearestSnapAngle = snapAngle
      }
    }
    // 1. 计算角度磁吸数据
    let angleSnapped: {
      objType: EntityType,
      objId: string,
      point: Point
    } | null = null
    if (minAngleDiff < 10) {
      const length = Math.hypot(dx, dy)
      const snapAngleRad = nearestSnapAngle * Math.PI / 180
      const snappedXTemp = nearestStart.point.x + length * Math.cos(snapAngleRad)
      const snappedYTemp = nearestStart.point.y + length * Math.sin(snapAngleRad)
      const distToMouse = Math.hypot(snappedXTemp - current.x, snappedYTemp - current.y)
      if (distToMouse < 10) {
        angleSnapped = {
          objType: nearestStart.objType,
          objId: nearestStart.objId,
          point: {
            x: snappedXTemp,
            y: snappedYTemp
          }
        }
      }
    }
    if (angleSnapped && (xAxisSnappedY.value !== null || yAxisSnappedX.value !== null)) {
      const angleRad = nearestSnapAngle * Math.PI / 180
      const k = Math.tan(angleRad)
      const b = angleSnapped.point.y - k * angleSnapped.point.x

      if (xAxisSnappedYVal !== null && yAxisSnappedXVal !== null) {
        // 同时命中x和y轴，计算角度线与两条轴对齐线的交点，选择更近的
        // 交点1：角度线与 x = yAxisSnappedXVal 的交点
        const intersect1Y = k * yAxisSnappedXVal.number + b
        const dist1 = Math.hypot(yAxisSnappedXVal.number - current.x, intersect1Y - current.y)

        // 交点2：角度线与 y = xAxisSnappedYVal 的交点
        let intersect2X: number
        if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
          intersect2X = angleSnapped.point.x
        } else if (Math.abs(angleRad) < 0.01 || Math.abs(angleRad - Math.PI) < 0.01 || Math.abs(angleRad + Math.PI) < 0.01) {
          intersect2X = xAxisSnappedYVal.number
        } else {
          intersect2X = (xAxisSnappedYVal.number - b) / k
        }
        const dist2 = Math.hypot(intersect2X - current.x, xAxisSnappedYVal.number - current.y)

        if (dist1 <= dist2) {
          snappedX = yAxisSnappedXVal.number
          snappedY = intersect1Y
        } else {
          snappedX = intersect2X
          snappedY = xAxisSnappedYVal.number
        }
      } else if (yAxisSnappedXVal !== null) {
        // 命中y轴对齐：交点是 (yAxisSnappedXVal, k * yAxisSnappedXVal + b)
        // 处理垂直线情况（90度或-90度）
        if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
          snappedX = yAxisSnappedXVal.number
          snappedY = angleSnapped.point.y
        } else {
          snappedX = yAxisSnappedXVal.number
          snappedY = k * yAxisSnappedXVal.number + b
        }
      } else if (xAxisSnappedYVal !== null) {
        // 命中x轴对齐：交点是 ((xAxisSnappedYVal - b) / k, xAxisSnappedYVal)
        // 处理水平线情况（0度或180度，k=0）和垂直线情况（90度或-90度）
        if (Math.abs(angleRad - Math.PI / 2) < 0.01 || Math.abs(angleRad + Math.PI / 2) < 0.01) {
          // 垂直线：x保持不变
          snappedX = current.x
        } else if (Math.abs(angleRad) < 0.01 || Math.abs(angleRad - Math.PI) < 0.01 || Math.abs(angleRad + Math.PI) < 0.01) {
          // 水平线：y保持为xAxisSnappedYVal，x使用angleSnapped.x
          snappedX = angleSnapped.point.x
        } else {
          snappedX = (xAxisSnappedYVal.number - b) / k
        }
        snappedY = xAxisSnappedYVal.number
      }
      return {
        objType: nearestStart.objType,
        objId: nearestStart.objId,
        snapFromType: 'line',
        point: roundNumberList({
          x: snappedX,
          y: snappedY
        })
      }
    }
    // 3. 第三优先级：单独角度磁吸
    if (angleSnapped) {
      snappedX = angleSnapped.point.x
      snappedY = angleSnapped.point.y
      return {
        objType: angleSnapped.objType,
        objId: angleSnapped.objId,
        snapFromType: 'line',
        point: roundNumberList({
          x: snappedX,
          y: snappedY
        })
      }
    }
  }
  // 4. 第四优先级：单独轴对齐磁吸
  if (xAxisSnappedYVal !== null && yAxisSnappedXVal !== null) {
    snappedX = yAxisSnappedXVal.number
    snappedY = xAxisSnappedYVal.number
    return {
      objType: yAxisSnappedXVal.objType,
      objId: yAxisSnappedXVal.objId,
      snapFromType: 'axis',
      point: roundNumberList({
        x: snappedX,
        y: snappedY
      })
    }
  }
  if (yAxisSnappedXVal !== null) {
    snappedX = yAxisSnappedXVal.number
    snappedY = current.y
    return {
      objType: yAxisSnappedXVal.objType,
      objId: yAxisSnappedXVal.objId,
      snapFromType: 'axis',
      point: roundNumberList({
        x: snappedX,
        y: snappedY
      })
    }
  }
  if (xAxisSnappedYVal !== null) {
    snappedX = current.x
    snappedY = xAxisSnappedYVal.number
    return {
      objType: xAxisSnappedYVal.objType,
      objId: xAxisSnappedYVal.objId,
      snapFromType: 'axis',
      point: roundNumberList({
        x: snappedX,
        y: snappedY
      })
    }
  }
  return null
}

function roundNumberList(point: { x: number, y: number }) {
  return { x: Math.round(point.x), y: Math.round(point.y) }
}
const worldApi = new World()
const drawWrapper = () => {
  const canvas = canvasRef.value
  if (canvas) {
    worldApi.draw2DWorld(
      canvas,
      tempDrawWall.value?.points || [],
      hoverPoint.value,
      currentTool.value,
      xAxisSnappedY.value === null ? null : xAxisSnappedY.value?.number,
      yAxisSnappedX.value === null ? null : yAxisSnappedX.value?.number,
      panOffset.value,
      canvasSize.value.width,
      canvasSize.value.height,
      zoomLevel.value,
      insertTempObj,
    )
    worldApi.draw3D()
  }
}

const activeCameraIndex = ref(0)
function changeCamera2State(index: number = 0) {
  if (worldApi.getObjects('camera')) {
    const allCameraList: CameraState[] = [];
    // console.log('生成摄像机', JSON.stringify(worldApi.getObjects('camera') as CameraData[]));
    (worldApi.getObjects('camera') as CameraData[]).forEach(cameraData => {
      allCameraList.push({
        targetPositionX: cameraData.targetPositionX,
        targetPositionY: cameraData.targetPositionY,
        targetPositionZ: cameraData.targetPositionZ,
        positionX: cameraData.x,
        positionY: cameraData.y,
        positionZ: cameraData.z,
        fov: cameraData.fov,
        aspectW: cameraData.aspectW,
        aspectH: cameraData.aspectH,
      });
    })
    allCamera.value = allCameraList
    cameraState2.value = allCameraList[index]
    activeCameraIndex.value = index
  } else {
    allCamera.value = []
    cameraState2.value = null
  }
}
onMounted(() => {
  worldApi.onChange(changeCamera2State)
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.canvas.width = 800
      ctx.canvas.height = 600;
      nextTick(() => {
        // (0,0)位移到中央
        const canvasContainer = document.querySelector('.canvas-container')
        if (canvasContainer) {
          const canvasRect = canvasContainer.getBoundingClientRect()
          const dx = canvasRect.width / 2
          const dy = canvasRect.height / 2
          panOffset.value.x += dx
          panOffset.value.y += dy
          panStartScreenX = screenX
          panStartScreenY = screenY
          drawWrapper()
        }
      })
      drawWrapper()
    }

    window.addEventListener('resize', () => updateCanvasSize())
    updateCanvasSize()

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (tempDrawWall.value?.points?.length && tempDrawWall.value.points.length > 0) {
          if (tempDrawWall.value?.points.length > 1) {
            const newWall: WallData = {
              id: tempDrawWall.value.id,
              x: tempDrawWall.value.x,
              y: tempDrawWall.value.y,
              z: tempDrawWall.value.z,
              color: '#fff',
              wmt: 0, // 墙材质
              height: 280, // 墙高，默认280
              points: [...tempDrawWall.value.points],
              walls: [],
              thickness: wallThickness.value,
              hb: true,// 有地板，默认有
              bc: '#aaa', // 地板颜色，默认灰色
              bmt: 2, // 地板材质，默认砖墙
              ht: true,// 有天花板，默认有
              tc: '#fff', // 天花板颜色，默认白色
              tmt: 2, // 天花板材质，默认水泥墙
              td: false, // 天花板是否是双面，默认否
            }
            await worldApi.add('wall', [newWall])
            history.value.push(JSON.parse(JSON.stringify(worldApi.getObjects('wall'))))
          }
          tempDrawWall.value = null
          lastPoint.value = null
          hoverPoint.value = null
        }
        drawWrapper()
        currentTool.value = 'drag'
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }
})

const fileInputRef = ref<HTMLInputElement | null>(null)

const saveDrawing = () => {
  const data: fileData & {
    panOffset: Point
    zoomLevel: number
    cameraState: CameraState
  } = {
    ...worldApi.getAllFileObjects(),
    panOffset: panOffset.value,
    zoomLevel: zoomLevel.value,
    cameraState: cameraState.value
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'floor-plan.json'
  a.click()
  URL.revokeObjectURL(url)
}

const loadDrawing = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      const data: fileData & {
        panOffset: Point
        zoomLevel: number
        cameraState: CameraState
      } = JSON.parse(event.target?.result as string)

      for (let i = 0; i < allFileKeys.length; i++) {
        const key = allFileKeys[i]
        const key2 = key as EntityType
        console.log('key2', key2, data[key2])
        await worldApi.add(key2, data[key2] || [])
      }

      panOffset.value = data.panOffset || { x: 0, y: 0 }
      zoomLevel.value = data.zoomLevel || 1
      if (data.cameraState) {
        cameraState.value = data.cameraState
      }
      history.value = []
      drawWrapper()
    } catch (error) {
      console.error(error)
    }
  }
  reader.readAsText(file)
  input.value = ''
}

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  editPropConfigInfo.value = []
  editPropInputInfo.value = {}
  editPropTypeIndex.value = -1

  for (let i = 0; i < allFileKeys.length; i++) {
    const type = allFileKeys[i]
    if (allFileKeys.includes(type)) {
      for (let j = 0; j < worldApi.getObjects(type).length; j++) {
        const item = worldApi.getObjects(type)[j]
        console.log('api', worldApi.allFileMapObjects)
        const api: EntityClass<any> = worldApi.allFileMapObjects[type][j]
        const snapPoints = api.getMineBeSnapPoints()
        for (let k = 0; k < snapPoints.length; k++) {
          const snapPoint = snapPoints[k]
          const dist = Math.hypot(x - snapPoint.point.x, y - snapPoint.point.y)
          if (dist < 10) {
            const propConfig = api.editPropConfig()
            console.log('dist', propConfig)
            let contextMenuX = e.clientX
            if (contextMenuX + 320 > panel1SplitWidthPer.value * window.innerWidth) {
              contextMenuX = panel1SplitWidthPer.value * window.innerWidth - 320
            }
            editPropTypeKey.value = type
            editPropTypeIndex.value = j
            editPropConfigInfo.value = propConfig
            editPropInputInfo.value = JSON.parse(JSON.stringify(item));
            contextMenu.value = {
              visible: true,
              x: contextMenuX,
              y: e.clientY,
              // @ts-ignore
              type,
              index: j
            }
            nextTick(() => {
              const height = document.querySelector('.context-menu')?.clientHeight
              if (height && contextMenu.value) {
                if (e.clientY + height > window.outerHeight) {
                  contextMenu.value.y = window.outerHeight - height - 5
                }
              }
            })
            return
          }
        }
      }
    }
  }
  contextMenu.value = null
}

const deleteContextMenuEntity = () => {
  if (!contextMenu.value) return

  const type = contextMenu.value.type;
  if (contextMenu.value.index !== undefined) {
    worldApi.splice(type, contextMenu.value.index)
  }
  contextMenu.value = null
  drawWrapper()
}

const handleCanvasClick = async (e: MouseEvent) => {
  // 如果当前是拖拽模式，不执行任何操作
  if (currentTool.value === 'drag') {
    return
  }
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  // 点击空白处隐藏 context menu
  if (contextMenu.value) {
    contextMenu.value = null
    return
  }

  if (currentTool.value === 'wall') {
    let clickPoint: Point = { x, y }

    if (tempDrawWall.value) {
      if (tempDrawWall.value.points.length > 0) {
        const last = {
          ...tempDrawWall.value.points[tempDrawWall.value.points.length - 1],
          index: tempDrawWall.value.points.length - 1,
        }
        // 收集所有点（包括临时折线和已绘制的墙上的点）
        const allPoints: Point[] = [...tempDrawWall.value.points];
        (worldApi.getObjects('wall') as WallData[]).forEach((wall: WallData) => {
          wall.points.forEach(point => {
            allPoints.push(point)
          })
        })
        let snapped = getSnapPoint([{
          objType: 'wall',
          objId: tempDrawWall.value.id,
          snapFromType: 'point',
          point: last
        }], clickPoint, allPoints.map((v, index) => ({
          objType: 'wall',
          objId: (tempDrawWall.value as WallData).id,
          snapFromType: 'point',
          point: {
            ...v,
            index,
          }
        })))
        if (snapped === null) {
          snapped = {
            objType: 'wall',
            objId: tempDrawWall.value.id,
            snapFromType: 'point',
            point: clickPoint
          }
        }
        const dist = Math.hypot(snapped.point.x - last.x, snapped.point.y - last.y)

        if (dist < 10 * zoomLevel.value) {
          if (tempDrawWall.value?.points?.length && tempDrawWall.value.points.length > 1) {
            const newWall: WallData = {
              id: Date.now().toString(),
              points: [...tempDrawWall.value.points],
              walls: [],
              x: 0,
              y: 0,
              color: '#fff',
              wmt: 0, // 墙材质
              height: 280, // 墙高
              z: 0,
              thickness: wallThickness.value,
              hb: true,// 有地板，默认有
              bc: '#aaa', // 地板颜色，默认灰色
              bmt: 2, // 地板材质，默认砖墙
              ht: true,// 有天花板，默认有
              tc: '#fff', // 天花板颜色，默认白色
              tmt: 2, // 天花板材质，默认水泥墙
              td: false, // 天花板是否是双面，默认否
            }
            await worldApi.add('wall', [newWall])
            history.value.push(JSON.parse(JSON.stringify(worldApi.getObjects('wall'))))
            tempDrawWall.value.points = []
            lastPoint.value = null
          }
          return
        }
        clickPoint = snapped.point
      }
      tempDrawWall.value?.points?.push(clickPoint)
    } else {
      tempDrawWall.value = {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        color: '#fff',
        wmt: 0, // 墙材质
        height: 280, // 墙高
        points: [clickPoint],
        walls: [],
        thickness: wallThickness.value,
        hb: true,// 有地板，默认有
        bc: '#aaa', // 地板颜色，默认灰色
        bmt: 2, // 地板材质，默认砖墙
        ht: true,// 有天花板，默认有
        tc: '#fff', // 天花板颜色，默认白色
        tmt: 2, // 天花板材质，默认水泥墙
        td: false, // 天花板是否是双面，默认否
      }
    }
    lastPoint.value = clickPoint
  } else if (insertTempObj) {
    if (insertTempObj instanceof EntityClassInWall) {
      if (hoverPoint.value) {
        await worldApi.add(currentTool.value, [insertTempObj.getData()])
        // insertTempObjData = null;
        console.log('nearest---2---clear-2')
        insertTempObj = null;
        currentTool.value = 'drag'
      }
    } else {
      await worldApi.add(currentTool.value, [insertTempObj.getData()])
      // insertTempObjData = null;
      console.log('nearest---2---clear-3')
      insertTempObj = null;
      currentTool.value = 'drag'
    }
  }

  drawWrapper()
}

const clearDrawing = () => {
  if (confirm('确定要清空所有绘制内容吗？')) {
    worldApi.clear('wall')
    worldApi.clear('door')
    worldApi.clear('window')
    worldApi.clear('camera')
    if (tempDrawWall.value) {
      tempDrawWall.value = null
    }
    history.value = []
    drawWrapper()
  }
}

// const undo = () => {
//   if (history.value.length > 0) {
//     worldApi.allFileObjects.wall = history.value.pop() || []
//     drawWrapper()
//   }
// }

const handleMouseMove = (e: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  // 如果正在拖拽，处理拖拽逻辑（即使当前工具不是 drag）
  if (matchHandelObj && matchHandelInfo) {
    function temp(api: EntityClass<ObjData>): boolean {
      if (matchHandelObj && matchHandelInfo) {
        let beMatchPoints = api.getMineBeSnapPoints()
        // 排出掉和自己磁吸
        beMatchPoints = beMatchPoints.filter(v => {
          if (v.snapFromType === 'point') {
            if (v.point.index === matchHandelInfo?.index) {
              return false;
            }
          }
          return true;
        })
        if (beMatchPoints.length > 0) {
          const snapped = getSnapPoint([], { x, y }, beMatchPoints)
          if (snapped !== null) {
            const result = matchHandelObj.inSceneSnapPointArea(
              {
                objType: api.type,
                objId: snapped.objId,
                snapFromType: 'point',
                point: snapped.point
              },
              matchHandelInfo,
            )
            if (result) {
              drawWrapper()
              return true;
            }
          }
        }
        const beMatchLines = api.getMineBeSnapLines()
        if (beMatchLines.length > 0) {
          let nearestPoint: Point | null = null
          let minDistance = Infinity
          let matchLine = null;
          for (let j = 0; j < beMatchLines.length; j++) {
            const line = beMatchLines[j]
            const distance = pointToLineDistance({ x, y }, line[0], line[1])
            if (distance < minDistance) {
              matchLine = line
              minDistance = distance
              nearestPoint = getClosestPointOnLine({ x, y }, line[0], line[1])
            }
          }
          if (nearestPoint && minDistance < snapThreshold) {
            const result = matchHandelObj.inSceneSnapPointArea({
              objType: api.type,
              objId: api.getData().id,
              snapFromType: 'line',
              point: nearestPoint
            }, matchHandelInfo)
            if (result) {
              if (matchLine) {
                matchHandelObj.afterBeSnapByLine(api, matchLine)
              }
              drawWrapper()
              return true;
            }
          }
        }
      }
      return false;
    }
    for (let i = 0; i < worldApi.getObjects('wall').length; i++) {
      // const wall = worldApi.getObjects('wall')[i] as Wall
      const api: WallEntity = worldApi.allFileMapObjects.wall[i] as WallEntity;
      if (temp(api)) {
        return;
      }
    }
    matchHandelObj.matchHandelMoveCallback(x, y, matchHandelInfo)
    drawWrapper()
  }

  // 如果正在平移画布
  if (isPanning.value && panStart.value) {
    const dx = screenX - panStartScreenX
    const dy = screenY - panStartScreenY
    panOffset.value.x += dx
    panOffset.value.y += dy
    panStart.value = { x, y }
    panStartScreenX = screenX
    panStartScreenY = screenY
    drawWrapper()
    return
  }

  // 如果当前是拖拽模式，处理拖拽逻辑
  if (currentTool.value === 'drag') {
    return
  }

  if (currentTool.value === 'wall') {
    if (tempDrawWall.value && tempDrawWall.value?.points?.length && tempDrawWall.value.points.length > 0) {
      const last = tempDrawWall.value.points[tempDrawWall.value.points.length - 1]
      const dist = Math.hypot(x - last.x, y - last.y)

      if (dist < snapThreshold) {
        hoverPoint.value = { ...last }
      } else {
        // 收集所有点（包括临时折线和已绘制的墙上的点）
        const allPoints = [...tempDrawWall.value.points];
        (worldApi.getObjects('wall') as WallData[]).forEach((wall: WallData) => {
          wall.points.forEach((point) => {
            allPoints.push(point)
          })
        })
        let snappedPoint = getSnapPoint([{
          objType: 'wall',
          objId: tempDrawWall.value.id,
          snapFromType: 'point',
          point: last
        }], { x, y }, allPoints.map(v => ({
          objType: 'wall',
          objId: (tempDrawWall.value as WallData).id,
          snapFromType: 'point',
          point: v
        })))
        if (snappedPoint === null) {
          snappedPoint = {
            objType: 'wall',
            objId: tempDrawWall.value.id,
            snapFromType: 'point',
            point: { x, y }
          }
        }
        if (snappedPoint) {
          hoverPoint.value = snappedPoint.point
        }
      }
    }
    drawWrapper()
  } else {
    const nearest = getNearestWall({ x, y })
    if (nearest) {
      hoverPoint.value = nearest.pointOnWall
    } else {
      hoverPoint.value = null
    }
    // const ObjDataClass = createInitData[currentTool.value];
    // const ClassName = fileDataKeyToClass[currentTool.value];
    // if (ObjDataClass) {
    //   // if (insertTempObjData instanceof ObjInWallDataClass) {
    //   //   if (nearest) {
    //   //     const { pointOnWall, angle } = nearest
    //   //     const wallScreenX = pointOnWall.x
    //   //     const wallScreenY = pointOnWall.y

    //   //     if (insertTempObjData instanceof ObjInWallDataClass) {
    //   //       insertTempObjData.wallId = nearest.wall.id
    //   //       insertTempObjData.wallPointId = nearest.lineIndex
    //   //       insertTempObjData.x = wallScreenX
    //   //       insertTempObjData.y = wallScreenY
    //   //       insertTempObjData.angle = angle
    //   //     }
    //   //     drawWrapper()
    //   //   }
    //   // } else if (insertTempObjData instanceof ObjDataClass) {
    //   //   if (insertTempObjData instanceof ObjDataClass) {
    //   //     insertTempObjData.x = x
    //   //     insertTempObjData.y = y
    //   //     // insertTempObjData.targetPositionX = x + 100
    //   //     // insertTempObjData.targetPositionY = y
    //   //   }
    //   //   drawWrapper()
    //   // }
    // }
    if (insertTempObj instanceof EntityClassInWall) {
      if (nearest) {
        insertTempObj.setPrepareState(x, y, nearest)
        drawWrapper()
      }
    } else if (insertTempObj instanceof EntityClass) {
      // console.log('nearest---1', nearest)
      insertTempObj.setPrepareState(x, y)
      drawWrapper()
    }
  }
}

let matchHandelObj: EntityClass<any> | null = null;
let matchHandelInfo: HandelInfo | null = null;
const handleMouseDown = (e: MouseEvent) => {
  contextMenu.value = null;

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top
  const x = (screenX - panOffset.value.x) / zoomLevel.value
  const y = (screenY - panOffset.value.y) / zoomLevel.value

  // 只有在拖拽模式下才能拖拽点
  if (currentTool.value === 'drag') {
    if (e.button !== 0) return

    const matchHandelInfoList: Array<{
      classInfo: EntityClass<any>
      handle: HandelInfo,
      startPooint: Point,
      dist: number,
    }> = []
    // 检查已绘制的墙上的点
    for (let i = 0; i < worldApi.getObjects('wall').length; i++) {
      // const wall = worldApi.getObjects('wall')[i]
      const api: WallEntity = worldApi.allFileMapObjects.wall[i] as WallEntity;
      const matchInfo = api.matchHandelInfo(x, y, zoomLevel.value)
      if (matchInfo) {
        matchHandelInfoList.push({
          classInfo: api,
          handle: matchInfo,
          startPooint: { x, y },
          dist: matchInfo.dist,
        })
      }
    }

    for (let i = 0; i < allFileKeys.length; i++) {
      const key = allFileKeys[i];
      if (key === 'wall') continue;
      for (let j = 0; j < worldApi.getObjects(key).length; j++) {
        const api: DoorEntity = worldApi.allFileMapObjects[key][j] as DoorEntity;
        const matchInfo = api.matchHandelInfo(x, y, zoomLevel.value)
        if (matchInfo) {
          matchHandelInfoList.push({
            classInfo: api,
            handle: matchInfo,
            startPooint: { x, y },
            dist: matchInfo.dist,
          })
        }
      }
    }

    const sortedMatchAllObjList = matchHandelInfoList.sort((a, b) => {
      return a.dist - b.dist
    })
    if (sortedMatchAllObjList.length > 0) {
      matchHandelObj = sortedMatchAllObjList[0].classInfo
      matchHandelInfo = sortedMatchAllObjList[0].handle

      dragOffset.value = { x: 0, y: 0 }
      dragStartPoint.value = {
        x: sortedMatchAllObjList[0].startPooint.x,
        y: sortedMatchAllObjList[0].startPooint.y
      }
      return;
    }

    console.log('sortedMatchAllObjList', sortedMatchAllObjList)

    // 如果没有拖拽到任何点，开始平移
    if (!draggedPoint.value) {
      isPanning.value = true
      panStart.value = { x, y }
      panStartScreenX = screenX
      panStartScreenY = screenY
    }
  }
}

const handleMouseUp = () => {
  matchHandelObj = null
  matchHandelInfo = null
  if (draggedPoint.value !== null) {
    history.value.push(JSON.parse(JSON.stringify(worldApi.getObjects('wall'))))
    draggedPoint.value = null
    dragOffset.value = null
    drawWrapper()
  }
  if (isPanning.value) {
    isPanning.value = false
    panStart.value = null
    drawWrapper()
  }
}

const dragSplitIndex = ref(0)
const startSplit = (index: number) => {
  dragSplitIndex.value = index
  isSplitting.value = true
  document.body.style.cursor = 'col-resize'
}

const handleMouseMoveSplit = (e: MouseEvent) => {
  if (!isSplitting.value) return

  const containerWidth = window.innerWidth

  const mousePositionPer = e.clientX / containerWidth
  if (dragSplitIndex.value === 1) {
    const panel1StartWidth = panel1SplitWidthPer.value;
    const panel2StartWidth = panel2SplitWidthPer.value;
    panel1SplitWidthPer.value = mousePositionPer
    panel2SplitWidthPer.value = panel2StartWidth - (mousePositionPer - panel1StartWidth)
  } else if (dragSplitIndex.value === 2) {
    const panel1StartWidth = panel1SplitWidthPer.value;
    const panel2StartWidth = panel2SplitWidthPer.value;
    // console.log(panel2StartWidth - ((panel2StartWidth + panel1StartWidth) - mousePositionPer));
    panel2SplitWidthPer.value = panel2StartWidth - ((panel2StartWidth + panel1StartWidth) - mousePositionPer)
  }
}

const handleMouseUpSplit = () => {
  if (isSplitting.value) {
    isSplitting.value = false
    document.body.style.cursor = 'default'
    updateCanvasSize()
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMoveSplit)
  window.addEventListener('mouseup', handleMouseUpSplit)

  const canvas = canvasRef.value
  if (canvas) {
    canvas.addEventListener('wheel', handleWheel)
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMoveSplit)
  window.removeEventListener('mouseup', handleMouseUpSplit)

  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('wheel', handleWheel)
  }
})

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
  const newZoomLevel = Math.max(0.1, Math.min(5, zoomLevel.value * zoomFactor))

  const zoomRatio = newZoomLevel / zoomLevel.value
  const newPanX = mouseX - (mouseX - panOffset.value.x) * zoomRatio
  const newPanY = mouseY - (mouseY - panOffset.value.y) * zoomRatio

  zoomLevel.value = newZoomLevel
  panOffset.value = { x: newPanX, y: newPanY }

  drawWrapper()
}
function changeCurrentTool(type: 'wall' | 'door' | 'window' | 'camera' | 'outFile' | 'drag') {
  // console.log('changeTool---1---nearest---2---clear')
  insertTempObj = null

  if (allFileKeys.includes(type as any)) {
    console.log('changeTool---2---nearest---2---clear')
    if (type === 'outFile') {
      const findObjInfo = ObjFiles[1];
      const data: OutFileData = {
        fileTypeId: findObjInfo.id,
        id: Date.now().toString(),
        angleY: 0,
        x: 0,
        y: 0,
        z: 0,
      }
      const insertTempObjData = new OutFileDataClass(data)
      console.log('changeTool---3---nearest---2---clear')
      insertTempObj = new OutFileEntity(worldApi, insertTempObjData)
      insertTempObj.init()
    } else {
      // @ts-ignore
      const ObjDataClass = createInitData[type];
      // @ts-ignore
      const ClassName = fileDataKeyToClass[type];
      if (ClassName && ObjDataClass) {
        const insertTempObjData = new ObjDataClass()
        console.log('changeTool---3---nearest---2---clear')
        insertTempObj = new ClassName(worldApi, insertTempObjData)
        if (insertTempObj) {
          insertTempObj.init()
        }
      }
    }
  }
  currentTool.value = type
}

function changeCurrentToolToOutFile(id: string) {
  const index = ObjFiles.findIndex(item => item.id === id);
  if (index === -1) return
  const findObjInfo = ObjFiles.find(item => item.id === id);
  if (!findObjInfo) return
  const data: OutFileData = {
    fileTypeId: findObjInfo.id,
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 0,
    angleY: 0,
  }
  const insertTempObjData = new OutFileDataClass(data)
  console.log('changeTool---3---nearest---2---clear')
  insertTempObj = new OutFileEntity(worldApi, insertTempObjData)
  currentTool.value = 'outFile'
}

watch(() => editPropInputInfo.value, () => {
  if (editPropTypeKey.value && editPropTypeIndex.value > -1) {
    // console.log(111, worldApi.getObjects(editPropTypeKey.value)[editPropTypeIndex.value], editPropInputInfo.value)
    // Object.assign(worldApi.getObjects(editPropTypeKey.value)[editPropTypeIndex.value], editPropInputInfo.value)
    worldApi.replaceObjects(editPropTypeKey.value, editPropTypeIndex.value, JSON.parse(JSON.stringify(editPropInputInfo.value)))
  }
  if (editPropTypeKey.value && editPropTypeIndex.value > -1) {
    const api: EntityClass<any> = worldApi.allFileMapObjects[editPropTypeKey.value][editPropTypeIndex.value]
    if (api) {
      editPropConfigInfo.value = api.editPropConfig()
      console.log('editPropConfigInfo.value---3', editPropConfigInfo.value)
    }
  }
  drawWrapper()
}, {
  deep: true
})

function updateEditPropInputNumberInfo(id: string, event: Event | number) {
  if (event instanceof Event && id) {
    // @ts-ignore
    editPropInputInfo.value[id] = +(+event.target.value)
  } else {
    editPropInputInfo.value[id] = event
  }
}
function updateEditPropInputInfo(id: string, event: Event) {
  // @ts-ignore
  editPropInputInfo.value[id] = event.target.value as string
}
function updateEditPropInputInfoBoolean(id: string, event: Event) {
  // @ts-ignore
  editPropInputInfo.value[id] = event.target.checked
}
function addObjFile(item: ObjItem) {
  // worldApi.addObjFile(item)
  drawWrapper()
}
</script>

<style scoped lang="less">
.map2d-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.toolbar {
  display: flex;
  padding: 4px 8px;
  background: white;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;

  .toolbar-item {
    position: relative;

    &:hover {
      .list {
        display: block;
      }
    }

    .list {
      position: absolute;
      display: none;
      top: 100%;
      width: 100px;
      left: 0;
      background: white;
      border: 1px solid #d9d9d9;
      box-sizing: border-box;
      border-radius: 8px;
      z-index: 1000;
      max-height: 80vh;
      overflow: auto;

      .childItem {
        padding: 4px 0;
        cursor: default;

        &:hover,
        &.active {
          background-color: #1890ff;
        }
      }
    }
  }
}

button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: #e4e6eb;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.toolbar button:hover {
  background: #d9d9d9;
}

.toolbar button.active {
  background: #1890ff;
  color: white;
}

.canvas-container {
  flex-grow: 1;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.drawing-canvas {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
  width: 100%;
  height: 100%;
}

.left-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
}

.right-panel {
  height: 100%;
  background: #f0f2f5;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  display: flex;

  .tools {
    left: 0;
    top: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    padding: 4px;
    background-color: white;
  }

  .right-panel-content {
    padding: 8px;
    width: 100%;
    flex-grow: 1;
    box-sizing: border-box;
  }
}

.split-bar {
  width: 4px;
  background: #d9d9d9;
  cursor: col-resize;
  transition: background 0.2s;
  z-index: 100;
}

.split-bar:hover {
  background: #1890ff;
}

.left-panel,
.right-panel {
  transition: width 0.1s ease;
}

.preview-label {
  margin-bottom: 20px;
  font-size: 16px;
  color: #666;
}

.drawing-canvas-3d {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.context-menu {
  position: absolute;
  width: 320px;
  background: white;
  border: 1px solid #d9d9d9;
  box-sizing: border-box;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 80vh;
  overflow: auto;

  .configList {
    padding: 8px;

    .configItem {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin: 4px 0;
    }
  }

  button {
    display: block;
    width: 100%;
    padding: 8px 16px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    color: #ff4d4f;

    &:hover {
      background: #f5f5f5;
    }
  }
}

.cameraList {
  display: flex;
  flex-grow: 1;

  .cameraItem {
    border: solid 1px black;
    width: 28px;
    height: 28px;
    line-height: 30px;
    text-align: center;
    border-radius: 4px;
    margin-left: 4px;
    cursor: pointer;

    &:hover {
      background-color: #f5f5f5;
    }

    &.active {
      background-color: #1890ff;
      border: solid 1px #1890ff;
      color: white;
    }
  }
}

.noCamera {
  font-size: 14px;
  color: #ff4d4f;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
