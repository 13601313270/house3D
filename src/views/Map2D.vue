<template>
  <div class="map2d-app">
    <div class="headTools">
      <div class="toolbar">
        <img class="icon" src="/favicon.ico" />
        <div class="toolbar-item" @mouseleave="activeToolsIndex = -1">
          <button type="button" @mouseenter="activeToolsIndex = 0">
            文件
          </button>
          <div class="list" v-show="activeToolsIndex === 0">
            <div @click="saveDrawing" class="childItem">
              保存
            </div>
            <div @click="loadDrawing" class="childItem">
              加载
            </div>
          </div>
        </div>
        <div class="toolbar-item" @click="onlyDemos = true, showDemos = true">
          <button type="button">
            示例
          </button>
        </div>
      </div>
      <div class="toolbar toolbar-right">
        <div v-if="store.state.main.userInfo" class="userInfo">
          欢迎登录：{{ store.state.main.userInfo.email }}
        </div>
        <button v-else type="button" class="login-btn" @click="showLogin = true">
          登录
        </button>
      </div>
    </div>
    <div class="map2d-container" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop">
      <div class="left-panel" :style="{ width: panel1SplitWidthPer * 100 + '%' }">
        <div class="toolbar">
          <div style="flex-shrink: 0;">布局图</div>

          <div class="toolbar-item" @mouseleave="activeToolsIndex = -1">
            <button type="button" @mouseenter="activeToolsIndex = 1">
              添加
            </button>
            <div class="list" v-show="activeToolsIndex === 1">
              <template v-if="lastChooseOutFile">
                <div class="childItem" @click="changeCurrentToolToOutFile(lastChooseOutFile.id)">
                  最近使用：{{ lastChooseOutFile.name }}
                </div>
                <div class="splitLine"></div>
              </template>
              <div>
                <div v-for="item in allFileKeysGroup.filter(item => item.id !== 'other')" :key="item.id"
                  class="typeItemContent">
                  <div class="typeName">{{ item.name }}</div>
                  <div class="childItemList" v-if="item.child && item.child.length > 0">
                    <div v-for="item2 in item.child" class="childItem" :key="item2" @click="changeCurrentTool(item2)">
                      {{ allFileKeysName[item2] }}
                    </div>
                  </div>
                </div>
                <div class="childItem"
                  v-for="value in (allFileKeysGroup.find(item => item.id === 'other') || { child: [] }).child.filter(item => item !== 'outFile' && item !== 'outFileInWall' && item !== 'importFile')"
                  :key="value" :class="{ active: currentTool === value }" @click="changeCurrentTool(value)">
                  {{ allFileKeysName[value] }}
                </div>
              </div>
              <div class="splitLine"></div>
              <div>
                <div v-for="item in ObjFileTypes" :key="item.id" class="typeItemContent">
                  <div class="typeName" @mouseenter="mouseEnterType(item)">{{ item.name }}</div>
                  <div class="childItemList" v-if="item.child && item.child.length > 0">
                    <div v-for="item2 in item.child" class="childItem" :key="item2.id"
                      @click="changeCurrentToolToOutFile(item2.id)">
                      {{ item2.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button @click="clearDrawing" type="button">
            清空
          </button>
          <input type="file" id="fileInput" ref="fileInputRef" accept=".devt" style="display: none"
            @change="handleFileChange" />
        </div>

        <!-- 拖拽上传区域 -->
        <!-- <div 
        class="drop-zone"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
        :class="{ 'drag-over': isDragOver }"
      >
        <div class="drop-zone-content">
          <div class="drop-icon">📦</div>
          <div class="drop-text">拖拽 FBX 或 OBJ 文件到此处</div>
          <div class="drop-hint">支持 .fbx 和 .obj 格式</div>
        </div>
      </div> -->

        <div class="canvas-container">
          <canvas ref="canvasRef" @click="handleCanvasClick" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
            @mouseup="handleMouseUp" @contextmenu="handleContextMenu" class="drawing-canvas"
            :style="{ display: isSplitting ? 'none' : 'block' }" />
          <div v-if="contextMenu?.visible" class="context-menu"
            :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }">
            <!-- {{ editPropConfigInfo }} -->
            <!-- {{ editPropInputInfo }} -->
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
        <div class="tools">
          <div style="flex-shrink: 0;">全景图</div>
        </div>
        <!-- {{ insertTempDoor }} -->
        <div class="right-panel-content">
          <Canvas3D ref="canvas3DRef" :world="worldApi" v-model:cameraState="cameraState" :aspectRatio="1"
            :showCamera="true" />
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
          <div v-if="allCamera.length && cameraState2">
            <button type="button" @click="exportImage">导出图片</button>
          </div>
        </div>
        <div class="right-panel-content">
          <Canvas3D v-if="allCamera.length && cameraState2" ref="canvas3DRef2" :world="worldApi"
            :cameraState="cameraState2" :aspectRatio="cameraState2.aspectW / cameraState2.aspectH"
            :showCamera="false" />
          <div v-else class="noCamera">请至少在场景中添加一个摄像机</div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="showDemos" class="allDemosContent">
    <div class="allDemosContentInner">
      <div class="title"><img class="icon" src="/favicon.ico" />欢迎来到<span class="p">「摄影棚」</span>，请选择创建场景的模板</div>
      <div v-if="onlyDemos" class="closeBtn" @click="showDemos = false">
        <img src="../assets/close.svg" alt="close" />
      </div>
      <div class="demoList">
        <div v-if="demoIniting" class="loading">...</div>
        <div class="demoItem" v-if="!onlyDemos" @click="showDemos = false">
          <div>新建空场景</div>
        </div>
        <div class="demoItem" v-if="!onlyDemos" @click="showDemos = false, loadDrawing()">
          <div>加载文件</div>
        </div>
        <div v-for="item in allDemos" :key="item.id" class="demoItem" @click="chooseDemo(item.id)">
          <div>{{ item.name }}</div>
          <img :src="item.img + '?x-oss-process=image/resize,m_fill,h_300,w_300'" alt="demo cover" />
        </div>
      </div>
    </div>
  </div>
  <Login v-if="showLogin" @close="showLogin = false" @login="handleLogin" />
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import axios from 'axios'
import * as THREE from 'three'
import JSZip from 'jszip';
import request from '@/utils/request'
// @ts-ignore
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
// @ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { ObjData, Point } from '../types'
import { snapThreshold, World } from '../utils/world'
import Canvas3D, { CameraState } from '../components/Canvas3D.vue'
import { WallData } from '@/entities/wall/index.d'
import { allFileKeys, fileData, editItem, allFileKeysName, fileDataKeyToClass, allFileKeysGroup } from '@/entities'
import { EntityClass, MatchSnapPoint } from '@/types/entity'
import { EntityClassInWall } from '@/types/entityInWall'
import { HandelInfo, PointWithIndex } from '@/types/map2d'
import pointToLineDistance from '@/utils/pointToLineDistance'
import { DoorEntity } from '@/entities/door/entity'
import { CameraData } from '@/entities/camera/index.d'
import { WallDataClass } from '@/entities/wall/dataClass'
import { WallEntity } from '@/entities/wall/entity'
import { ImportFileType, ObjOutputFileType } from '@/entities/allObjs'
import { OutFileDataClass } from '@/entities/outFile/dataClass'
import { OutFileEntity } from '@/entities/outFile/entity'
import { OutFileData } from '@/entities/outFile/index.d'

import { OutFileInWallDataClass } from '@/entities/outFileInWall/dataClass'
import { OutFileInWallEntity } from '@/entities/outFileInWall/entity'
import { OutFileInWallData } from '@/entities/outFileInWall/index.d'

import DataTypeEdit from './DataTypeEdit.vue'
import { ImportFileDataClass } from '@/entities/importFile/dataClass';
import { ImportFileData } from '@/entities/importFile/index.d';
import Login from '@/components/Login.vue'
import { useStore } from 'vuex';
import { Store } from '@/store';

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvas3DRef = ref<typeof Canvas3D | null>(null)
const canvas3DRef2 = ref<typeof Canvas3D | null>(null)
const activeToolsIndex = ref(-1)
const currentTool = ref<string | 'drag'>('drag')
const tempDrawWall = ref<WallDataClass | null>(null)
const hoverPoint = ref<Point | null>(null)
const lastPoint = ref<Point | null>(null)
const history = ref<WallDataClass[][]>([])
const xAxisSnappedY = ref<{ objType: string; number: number } | null>(null)
const yAxisSnappedX = ref<{ objType: string; number: number } | null>(null)
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
const panel1SplitWidthPer = ref(0.35)
const panel2SplitWidthPer = ref(0.35)
const isSplitting = ref(false)
const canvasSize = ref({ width: 0, height: 0 })
const zoomLevel = ref(1)
const wallThickness = ref<number>(20)

const allMaterialShow = ref(false)
const allMaterialShowPropId = ref<string>()
const showLogin = ref(false)
const showDemos = ref(false)
const onlyDemos = ref(false)
const allDemos = ref<any[]>([])
const demoIniting = ref(false)

// 拖拽上传相关状态
const isDragOver = ref(false)
const isUploading = ref(false)

const store = useStore<Store>()

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
type ObjFileType = {
  id: number,
  name: string,
  child: {
    id: string,
    name: string,
    type: number,
  }[]
}
const ObjFileTypes = ref<Array<ObjFileType>>([])

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
const editPropTypeKey = ref<string>()
const editSnapPoint = ref<HandelInfo>()
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
    objType: string,
    objId: string,
    number: number
  } | null = null // 命中的y坐标值（水平对齐，即y值与某个点一致）
  let yAxisSnappedXVal: {
    objType: string,
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
      objType: string,
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
function changeCamera2State(activeIndex: number = 0) {
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
    cameraState2.value = allCameraList[activeIndex]
    activeCameraIndex.value = activeIndex
    worldApi.activeCameraIndex = activeIndex
    if (worldApi.allFileMapObjects.camera) {
      worldApi.allFileMapObjects.camera.forEach((camera, index) => {
        if (index === activeIndex) {
          // @ts-ignore
          if (camera.active === false) {
            // @ts-ignore
            camera.active = true
            camera.remove3DCache()
          }
        } else {
          // @ts-ignore
          if (camera.active === true) {
            // @ts-ignore
            camera.active = false
            camera.remove3DCache()
          }
        }
      })
      drawWrapper()
    }
  } else {
    allCamera.value = []
    cameraState2.value = null
  }
}

onMounted(async () => {
  const res = await axios.get('https://api.studying1v1.com/video/objectFileType')
  const data = res.data as Array<{
    id: number,
    name: string,
    child: {
      id: string,
      name: string,
      type: number,
    }[]
  }>;
  axios.get('https://api.studying1v1.com/video/scene/demoList').then(res => {
    console.log('res.data', res.data)
    allDemos.value = res.data
    if (res.data.length) {
      showDemos.value = true
    }
  })
  ObjFileTypes.value = data;

  worldApi.onChange(() => {
    changeCamera2State(activeCameraIndex.value)
  })
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
              thickness: wallThickness.value,
              hb: true,// 有地板，默认有
              bc: '#aaa', // 地板颜色，默认灰色
              bmt: 2, // 地板材质，默认砖墙
              ht: true,// 有天花板，默认有
              tc: '#fff', // 天花板颜色，默认白色
              tmt: 2, // 天花板材质，默认水泥墙
              td: false, // 天花板是否是双面，默认否
              bottom: 0, // 距离地面距离，默认0
            }
            await worldApi.add('wall', [newWall])
            history.value.push(JSON.parse(JSON.stringify(worldApi.getObjects('wall'))))
          }
          tempDrawWall.value = null
          lastPoint.value = null
          hoverPoint.value = null
        } else {
          if (insertTempObj && currentTool.value !== 'drag') {
            console.log('insertTempObj----1111')
            insertTempObj = null;
          }
        }
        drawWrapper()
        currentTool.value = 'drag'
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // setTimeout(() => {
    //   try {
    //     initWorldByData(initDefaultFile)
    //   } catch (error) {
    //     console.error(error)
    //   }
    // }, 0)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }
})

const fileInputRef = ref<HTMLInputElement | null>(null)

const saveDrawing = async () => {
  activeToolsIndex.value = -1
  const data: fileData & {
    panOffset: Point
    zoomLevel: number
    cameraState: CameraState
    activeCameraIndex: number
  } = {
    ...worldApi.getAllFileObjects() as any,
    panOffset: panOffset.value,
    zoomLevel: zoomLevel.value,
    cameraState: cameraState.value,
    activeCameraIndex: activeCameraIndex.value
  }

  const zip = new JSZip();

  const json = JSON.stringify(data, null, 2)

  // 保存 JSON 配置
  zip.file(
    'scene.json',
    json
  );

  const allImportFiles = worldApi.allImportFiles
  console.log('allImportFiles', allImportFiles)

  // 保存资源文件
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    for (const file of allImportFiles) {
      assetsFolder.file(file.fileTypeId, file.file);
    }
  }

  // 生成 ZIP
  const blob = await zip.generateAsync({
    type: 'blob'
  });

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'floor-plan.devt'
  a.click()
  // URL.revokeObjectURL(url)
  // const blob = new Blob([json], { type: 'application/json' })
  // const url = URL.createObjectURL(blob)
  // const a = document.createElement('a')
  // a.href = url
  // a.download = 'floor-plan.json'
  // a.click()
  // URL.revokeObjectURL(url)
}

const loadDrawing = () => {
  worldApi.clearAll()
  activeToolsIndex.value = -1
  fileInputRef.value?.click()
}

const handleFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 1. 解压 ZIP
  const zip = await JSZip.loadAsync(file);

  const t = await zip.file('scene.json');
  if (!t) return
  // 2. 读取 scene.json
  const sceneJsonText = await t.async('string');
  const sceneData = JSON.parse(sceneJsonText);

  console.log(sceneData)
  if (sceneData.importFile && sceneData.importFile.length) {
    for (const v of sceneData.importFile) {
      const { fileTypeId, scale, color } = v
      const read = await zip.file(`assets/${fileTypeId}`);
      const extension = fileTypeId.split('.').pop()?.toLowerCase();
      if (!read) continue
      const blob = await read.async('blob');
      const url = URL.createObjectURL(blob);
      const file = new File([blob], fileTypeId, { type: blob.type || 'application/octet-stream' })

      // // console.log('blob', blob, url)
      // const fileExtension = v.fileName ? v.fileName.split('.').pop()?.toLowerCase() || '' : '';
      console.log('blob', blob, url, file, file.name, extension)
      processUploadedFile(file, v)
    }
  }

  // // 3. 遍历场景对象
  // for (const obj of sceneData.objects) {
  //   const path = obj.file; // 如 assets/house.fbx

  //   // 4. 从 ZIP 中读取二进制
  //   const assetBlob = await zip.file(path).async('blob');

  //   // 5. 创建临时 URL
  //   const url = URL.createObjectURL(assetBlob);

  //   // 6. 用 Three.js 加载
  //   loadModel(url, obj);

  //   // 7. 模型加载完成后记得 URL.revokeObjectURL(url)
  // }

  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      const data: fileData & {
        panOffset: Point
        zoomLevel: number
        cameraState: CameraState
        activeCameraIndex: number
      } = JSON.parse(sceneJsonText as string)

      await initWorldByData(data)
    } catch (error) {
      console.error(error)
    }
  }
  reader.readAsText(file)
  input.value = ''
}

async function initWorldByData(data: fileData & {
  panOffset: Point
  zoomLevel: number
  cameraState: CameraState
  activeCameraIndex: number
}) {
  const allFileTypeId = new Set()
  if (data.outFile) {
    data.outFile.forEach(v => {
      // @ts-ignore
      allFileTypeId.add(v.fileTypeId)
    })
  }
  if (data.outFileInWall) {
    data.outFileInWall.forEach(v => {
      // @ts-ignore
      allFileTypeId.add(v.fileTypeId)
    })
  }

  const fileTypes = Array.from(allFileTypeId)

  const { data: res } = await axios.post('https://api.studying1v1.com/video/objectFileByIds', {
    ids: fileTypes
  })

  res.forEach((v: ObjOutputFileType) => {
    worldApi.ObjFileTypes.push(v)
  })

  console.log('data------', res)

  for (let i = 0; i < allFileKeys.length; i++) {
    const key = allFileKeys[i]
    await worldApi.add(key, data[key] || [])
  }

  panOffset.value = data.panOffset || { x: 0, y: 0 }
  zoomLevel.value = data.zoomLevel || 1
  if (data.cameraState) {
    cameraState.value = data.cameraState
  }
  if (data.activeCameraIndex !== undefined) {
    changeCamera2State(data.activeCameraIndex)
  }
  history.value = []
  drawWrapper()
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
  const sortAllFileKeys = ([...allFileKeys]).reverse();

  for (let i = 0; i < sortAllFileKeys.length; i++) {
    const type = sortAllFileKeys[i]
    if (sortAllFileKeys.includes(type)) {
      if (!worldApi.allFileMapObjects[type]) {
        continue
      }
      for (let j = 0; j < worldApi.getObjects(type).length; j++) {
        const api: EntityClass<any> = worldApi.allFileMapObjects[type][j]
        const snapPoint = api.matchHandelInfo(x, y, zoomLevel.value)
        if (snapPoint) {
          api.editPropConfig(snapPoint, (propConfig, callback) => {
            console.log('dist', propConfig)
            let contextMenuX = e.clientX
            if (contextMenuX + 320 > panel1SplitWidthPer.value * window.innerWidth) {
              contextMenuX = panel1SplitWidthPer.value * window.innerWidth - 320
            }
            editSnapPoint.value = snapPoint
            editPropTypeKey.value = type
            editPropTypeIndex.value = j
            editPropConfigInfo.value = propConfig
            const inputData: any = {}
            propConfig.forEach(v => {
              inputData[v.id] = v.value
            })
            editPropInputInfo.value = inputData;
            nextTick(() => {
              contextMenu.value = {
                visible: true,
                x: contextMenuX,
                y: e.clientY,
                // @ts-ignore
                type,
                index: j
              }
              editPropConfigEditCallback = (val: any) => {
                callback(val)
                drawWrapper()
              }
              nextTick(() => {
                const height = document.querySelector('.context-menu')?.clientHeight
                if (height && contextMenu.value) {
                  if (e.clientY + height > window.outerHeight) {
                    contextMenu.value.y = window.outerHeight - height - 5
                  }
                }
              })
            })
          })
          return;
        }
      }
    }
  }
  contextMenu.value = null
}

let editPropConfigEditCallback = (val: any) => {
  console.log(val)
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
              bottom: 0, // 距离地面距离，默认0
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
      tempDrawWall.value?.points?.push({
        ...clickPoint,
        snw: false,
      })
    } else {
      tempDrawWall.value = {
        id: Date.now().toString(),
        x: 0,
        y: 0,
        z: 0,
        color: '#fff',
        wmt: 0, // 墙材质
        height: 280, // 墙高
        points: [{
          ...clickPoint,
          snw: false,
        }],
        thickness: wallThickness.value,
        hb: true,// 有地板，默认有
        bc: '#aaa', // 地板颜色，默认灰色
        bmt: 2, // 地板材质，默认砖墙
        ht: true,// 有天花板，默认有
        tc: '#fff', // 天花板颜色，默认白色
        tmt: 2, // 天花板材质，默认水泥墙
        td: false, // 天花板是否是双面，默认否
        bottom: 0, // 距离地面距离，默认0
      }
    }
    lastPoint.value = clickPoint
  } else if (insertTempObj) {
    if (insertTempObj instanceof EntityClassInWall) {
      if (hoverPoint.value) {
        await worldApi.add(currentTool.value, [insertTempObj.getData()])
        insertTempObj = null;
        currentTool.value = 'drag'
      }
    } else {
      await worldApi.add(currentTool.value, [insertTempObj.getData()])
      insertTempObj = null;
      currentTool.value = 'drag'
    }
  }

  drawWrapper()
}

const clearDrawing = () => {
  if (confirm('确定要清空所有绘制内容吗？')) {
    worldApi.clearAll();
    history.value = []
    drawWrapper()
  }
}

const handleLogin = (email: string, password: string) => {
  console.log('Login attempt:', email, password)
  showLogin.value = false
  loginByToken();
}

const loginByToken = () => {
  request.get('/video/user/info').then(res => {
    console.log(res)
    if (res.status === 200) {
      store.dispatch('main/setUserInfo', res.data)
    }
  })
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
            if (matchLine) {
              const result2 = matchHandelObj.inSceneSnapLineArea(api, matchLine, nearestPoint)
              if (result2) {
                drawWrapper()
                return true;
              }
            }
          }
        }
      }
      return false;
    }
    if (worldApi.allFileMapObjects.wall) {
      for (let i = 0; i < worldApi.getObjects('wall').length; i++) {
        // const wall = worldApi.getObjects('wall')[i] as Wall
        const api: WallEntity = worldApi.allFileMapObjects.wall[i] as WallEntity;
        if (temp(api)) {
          return;
        }
      }
    }

    matchHandelObj.notInSceneSnapLineArea()
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
    if (worldApi.allFileMapObjects.wall) {
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
    }

    for (let i = 0; i < allFileKeys.length; i++) {
      const key = allFileKeys[i];
      if (key === 'wall') continue;
      if (!worldApi.allFileMapObjects[key]) {
        continue
      }
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
  loginByToken();
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
function changeCurrentTool(type: string | 'drag') {
  activeToolsIndex.value = -1
  insertTempObj = null

  if (allFileKeys.includes(type as any)) {
    if (type === 'outFile' || type === 'outFileInWall') {
      // 不该进入这里
      // const findObjInfo = worldApi.ObjFileTypes[1];
      // if (type === 'outFileInWall') {
      //   const data: OutFileInWallData = {
      //     fileTypeId: findObjInfo.id,
      //     id: Date.now().toString(),
      //     bm: findObjInfo.materialId,
      //     x: 0,
      //     y: 0,
      //     z: findObjInfo.defaultZ || 0,
      //     angle: 0,
      //     wallPointId: -1,
      //     bottom: 40,
      //     isOuter: false,
      //     color: findObjInfo.defaultColor,
      //   }
      //   const insertTempObjData = new OutFileInWallDataClass(data)
      //   insertTempObj = new OutFileInWallEntity(worldApi, insertTempObjData)
      //   insertTempObj.init()
      // } else {
      //   const data: OutFileData = {
      //     fileTypeId: findObjInfo.id,
      //     id: Date.now().toString(),
      //     bm: findObjInfo.materialId,
      //     angleY: 0,
      //     x: 0,
      //     y: 0,
      //     z: 0,
      //     color: findObjInfo.defaultColor,
      //   }
      //   const insertTempObjData = new OutFileDataClass(data)
      //   insertTempObj = new OutFileEntity(worldApi, insertTempObjData)
      //   insertTempObj.init()
      // }
    } else {
      // @ts-ignore
      const ClassName = fileDataKeyToClass[type];
      if (ClassName) {
        insertTempObj = new ClassName(worldApi)
        if (insertTempObj) {
          insertTempObj.init()
        }
      }
    }
  }
  currentTool.value = type
}

const lastChooseOutFile = ref<ObjOutputFileType>()

async function changeCurrentToolToOutFile(id: string) {
  activeToolsIndex.value = -1
  const index = worldApi.ObjFileTypes.findIndex(item => item.id === id);
  if (index === -1) {
    const { data } = await axios.get('https://api.studying1v1.com/video/objectFileById/' + id)
    const res: ObjOutputFileType = data;
    lastChooseOutFile.value = res;
    worldApi.ObjFileTypes.push(res)
  } else {
    lastChooseOutFile.value = worldApi.ObjFileTypes[index];
  }
  const findObjInfo = worldApi.ObjFileTypes.find(item => item.id === id);
  if (!findObjInfo) return

  if (findObjInfo.inWall) {
    const data: OutFileInWallData = {
      id: Date.now().toString(),
      fileTypeId: findObjInfo.id,
      bm: findObjInfo.materialId,
      x: 0,
      y: 0,
      z: findObjInfo.defaultZ || 0,
      angle: 0,
      wallPointId: -1,
      bottom: 40,
      color: findObjInfo.defaultColor,
      isOuter: false,
    }
    const insertTempObjData = new OutFileInWallDataClass(data)
    insertTempObj = new OutFileInWallEntity(worldApi, insertTempObjData)
    insertTempObj.init()
    currentTool.value = 'outFileInWall'
  } else {
    const data: OutFileData = {
      fileTypeId: findObjInfo.id,
      id: Date.now().toString(),
      x: 0,
      y: 0,
      z: 0,
      bm: findObjInfo.materialId,
      angleY: 0,
      color: findObjInfo.defaultColor,
    }
    const insertTempObjData = new OutFileDataClass(data)
    insertTempObj = new OutFileEntity(worldApi, insertTempObjData)
    insertTempObj.init()
    currentTool.value = 'outFile'
  }
}

async function mouseEnterType(type: ObjFileType) {
  if (!type.child || type.child.length === 0) {
    type.child = [];
    const { data: res } = await axios.get('https://api.studying1v1.com/video/objectFileListByType/' + type.id)
    res.forEach((v: {
      id: string,
      name: string,
      type: number,
    }) => {
      type.child.push(v)
    })
  }
}

watch(() => editPropInputInfo.value, () => {
  if (contextMenu.value?.visible) {
    editPropConfigEditCallback(editPropInputInfo.value)
  }
}, {
  deep: true
})

function exportImage() {
  if (canvas3DRef2.value) {
    const canvas = canvas3DRef2.value
    canvas.exportImage()
  }
}

function chooseDemo(id: number) {
  demoIniting.value = true
  axios.get('https://api.studying1v1.com/video/scene/demo/' + id).then(res => {
    console.log('res.data', res.data.json)
    const initDefaultFile = res.data.json
    initWorldByData(initDefaultFile).finally(() => {
      showDemos.value = false
      demoIniting.value = false
    })
  })
}

// 拖拽上传相关方法
const onDragOver = (e: DragEvent) => {
  isDragOver.value = true
}

const onDragLeave = (e: DragEvent) => {
  const target = e.currentTarget as HTMLElement
  if (!target.contains(e.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

const onDrop = async (e: DragEvent) => {
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  const fileName = file.name.toLowerCase()

  // if (fileName.endsWith('.devt')) {
  //   alert('请上传 DEVT 格式的文件~~~~~')
  //   return
  // }

  // 检查文件类型
  if (!fileName.endsWith('.fbx') && !fileName.endsWith('.obj')) {
    alert('请上传 FBX 或 OBJ 格式的文件')
    return
  }

  // 检查文件大小
  if (file.size === 0) {
    alert(`文件 "${file.name}" 大小为 0 字节，请检查文件是否损坏或为空`)
    return
  }

  // 检查文件大小限制（例如 100MB）
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    alert(`文件 "${file.name}" 太大（${(file.size / 1024 / 1024).toFixed(2)} MB），请上传小于 100MB 的文件`)
    return
  }

  isUploading.value = true

  try {
    await processUploadedFile(file)
  } catch (error) {
    console.error('文件处理失败:', error)
    alert('文件处理失败，请重试')
  } finally {
    isUploading.value = false
  }
}

const processUploadedFile = async (file: File, v?: ImportFileData): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.obj')) {
      const objectUrl = URL.createObjectURL(file)
      const loader = new OBJLoader()
      loader.load(
        objectUrl,
        (object: THREE.Group) => {
          handleLoadedObject(object, file, 'obj', v)
          URL.revokeObjectURL(objectUrl)
          resolve()
        },
        (xhr: any) => {
          console.log(`OBJ 加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`)
        },
        (error: any) => {
          console.error('OBJ 文件加载失败:', error)
          URL.revokeObjectURL(objectUrl)
          reject(error)
        }
      )
    } else if (fileName.endsWith('.fbx')) {
      console.log('开始读取 FBX 文件:', file.name, '大小:', file.size, 'bytes')
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          console.log('FBX 文件读取成功，开始解析')
          const arrayBuffer = event.target?.result as ArrayBuffer
          if (!arrayBuffer) {
            reject(new Error('文件读取失败'))
            return
          }

          console.log('ArrayBuffer 大小:', arrayBuffer.byteLength)
          const loader = new FBXLoader()
          const object = loader.parse(arrayBuffer, '')
          console.log('FBX 文件解析成功，对象:', object)
          handleLoadedObject(object, file, 'fbx', v)
          resolve()
        } catch (error) {
          console.error('FBX 文件解析失败:', error)
          reject(error)
        }
      }
      reader.onerror = (error) => {
        console.error('FBX 文件读取失败:', error)
        console.error('文件信息:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified)
        })
        reject(new Error('文件读取失败'))
      }
      reader.readAsArrayBuffer(file)
    } else {
      reject(new Error('不支持的文件格式'))
    }
  })
}

const handleLoadedObject = (object: THREE.Group, file: File, type: string, v?: ImportFileData) => {
  const scaleFactor = (() => {
    if (v) {
      return v.scale
    } else {
      // 计算模型的包围盒以确定尺寸
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      // 计算缩放因子，使模型最大边为 100
      const maxDimension = Math.max(size.x, size.y, size.z)
      const targetMaxSize = 100 // 最大边目标尺寸
      return maxDimension > 0 ? targetMaxSize / maxDimension : 1
    }
  })();
  const fileTypeId = v?.fileTypeId || `custom_${Date.now()}.${type}`
  console.log('fileTypeId', fileTypeId)
  // 创建自定义的 ObjItem 用于 worldApi
  const customObjItem: ImportFileType = {
    fileTypeId,
    mesh: object,
    file,
  }

  // 添加到 ObjFileTypes
  worldApi.allImportFiles.push(customObjItem)

  // 创建 outFile 数据并添加到场景
  const data: ImportFileData = {
    fileTypeId,
    id: Date.now().toString(),
    x: 0,
    y: 0,
    z: 0,
    bm: null,
    angleY: 0,
    color: '#0c7f25',
    scale: scaleFactor,
  }

  // 将 THREE.Group 存储到自定义属性中供后续使用
  // @ts-ignore
  // customObjItem._threeObject = object

  // @ts-ignore
  // window.sss = object;
  // object.scale.set(scaleFactor, scaleFactor, scaleFactor)
  // worldApi.scene.add(object)
  // 使用 worldApi 添加对象
  worldApi.add('importFile', [new ImportFileDataClass(data)])

  drawWrapper()
}
</script>

<style scoped lang="less">
.map2d-app {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.headTools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(90deg, #141b44 0%, #190554 100%);
  padding-right: 8px;

  .toolbar {
    display: flex;
    padding: 0;
    width: auto;

    .icon {
      width: 40px;
      height: 40px;
      margin-right: 8px;
    }

    .toolbar-item {

      button {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: white;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s;
      }

      .list {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
      }
    }
  }

  .userInfo {
    color: white;
  }
}

.map2d-container {
  display: flex;
  width: 100vw;
  flex: 1;
  overflow: hidden;
}

.toolbar {
  display: flex;
  padding: 4px 8px;
  align-items: center;
  // background: white;
  gap: 8px;
  height: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;

  .toolbar-item {
    position: relative;

    .list {
      position: absolute;
      top: 100%;
      width: 160px;
      left: 0;
      background: white;
      border: 1px solid #d9d9d9;
      box-sizing: border-box;
      border-radius: 8px;
      padding: 8px 0;
      z-index: 1000;
      max-height: 80vh;
      // overflow: auto;

      .typeItemContent {
        position: relative;

        &:hover {
          .typeName {
            background-color: #1890ff;
            color: white;
            font-weight: bold;
            position: relative;

            &::after {
              color: white;
            }
          }

          .childItemList {
            display: block;
          }
        }

        .typeName {
          padding: 4px 0;
          cursor: default;

          &::after {
            content: '';
            background-image: url('../assets/right.svg');
            background-size: cover;
            background-position: center;
            position: absolute;
            height: 100%;
            line-height: 22px;
            top: 10px;
            right: 4px;
            width: 10px;
            height: 10px;
            opacity: 0.7;
            color: black;
            font-size: 12px;
            border-radius: 50%;
          }
        }

        .childItemList {
          position: absolute;
          display: none;
          top: -8px;
          left: 100%;
          width: 100px;
          background: white;
          border: 1px solid #d9d9d9;
          box-sizing: border-box;
          border-radius: 8px;
          padding: 7px 0;
          z-index: 1001;

          .childItem {
            &:hover {
              background-color: #1890ff;
              color: white;
              font-weight: bold;
            }
          }
        }
      }

      .childItem {
        padding: 4px 0;
        cursor: default;

        &:hover,
        &.active {
          background-color: #1890ff;
        }
      }

      .splitLine {
        width: 100%;
        height: 1px;
        margin: 8px 0;
        background-color: #d9d9d9;
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
  // overflow: hidden; // 不能添加overflow: hidden;不然添加弹窗向右展开二级，被隐藏
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
    height: 40px;
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

.allDemosContent {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #00000094;
  z-index: 200;

  .allDemosContentInner {
    margin: 0 auto;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    background-color: white;
    padding: 16px;
    box-sizing: border-box;
    position: relative;

    .title {
      font-size: 22px;
      line-height: 40px;
      color: #666;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
        margin-right: 8px;
        border-radius: 4px;
      }

      .p {
        font-weight: bold;
        color: black;
      }
    }

    .closeBtn {
      position: absolute;
      top: 24px;
      right: 24px;
      width: 24px;
      height: 24px;
      cursor: pointer;

      img {
        height: 100%;
      }
    }

    .demoList {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      .loading {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        font-size: 16px;
        color: #666;
        display: flex;
        background: #00000038;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 36px;
        cursor: default;
      }
    }

    @media (min-width: 680px) {
      .demoList {
        grid-template-columns: repeat(3, 1fr);
        /* 对应4列宽度 */
      }
    }

    /* ≥1000px 时，一行4个 */
    @media (min-width: 1000px) {
      .demoList {
        grid-template-columns: repeat(4, 1fr);
        /* 对应4列宽度 */
      }
    }

    .demoItem {
      width: 200px;
      cursor: default;
      font-size: 16px;
      color: #666;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      box-sizing: border-box;

      >img {
        width: 100%;
      }
    }
  }
}

/* 拖拽上传区域样式 */
.drop-zone {
  width: calc(100% - 16px);
  margin: 8px;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;

  &:hover {
    border-color: #1890ff;
    background: #e6f7ff;
  }

  &.drag-over {
    border-color: #1890ff;
    background: #e6f7ff;
    box-shadow: 0 0 12px rgba(24, 144, 255, 0.4);
  }

  .drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .drop-icon {
    font-size: 36px;
  }

  .drop-text {
    font-size: 16px;
    color: #666;
    font-weight: 500;
  }

  .drop-hint {
    font-size: 12px;
    color: #999;
  }
}
</style>
