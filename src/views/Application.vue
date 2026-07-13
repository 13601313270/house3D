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
            <div @click="loadProgramFile" class="childItem">
              加载
            </div>
            <div @click="clearDrawing" class="childItem">
              清空
            </div>
          </div>
        </div>
        <div class="toolbar-item" @click="onlyDemos = true, showDemos = true">
          <button type="button">
            示例
          </button>
        </div>
        <div class="toolbar-item" @mouseleave="activeToolsIndex = -1">
          <button type="button" @mouseenter="activeToolsIndex = 3">
            帮助
          </button>
          <div class="list" v-show="activeToolsIndex === 3">
            <div @click="showHelpModal = true" class="childItem">
              支持
            </div>
          </div>
        </div>
      </div>
      <div class="toolbar right">
        <div class="toolbar-item" @mouseleave="activeToolsIndex = -1">
          <div v-if="store.state.main.userInfo">
            <div class="userInfo" @mouseenter="activeToolsIndex = 2">
              <span>欢迎登录：{{ store.state.main.userInfo.email }}（</span>
              <img src="money.png" />
              <span>{{ store.state.main.userInfo.money }}金币）</span>
            </div>
            <div class="list" v-show="activeToolsIndex === 2">
              <div class="userMoney">
                <span>当前金币：{{ store.state.main.userInfo.money }}</span>
                <img src="money.png" />
              </div>
              <div @click="showPayModal = true" class="childItem">
                充值
              </div>
              <div @click="logout" class="childItem">
                退出
              </div>
            </div>
          </div>
          <button v-else type="button" class="login-btn" @click="showLogin = true">
            登录
          </button>
        </div>
      </div>
    </div>
    <div class="map2d-container" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop">
      <div class="left-panel" :style="{ width: panel1SplitWidthPer * 100 + '%' }">
        <div class="toolbar">
          <div style="flex-shrink: 0;">布局图</div>
          <ObjTypeSelect :currentTool="currentTool" @select="changeObjTypeSelect"
            @showHelpModal="showHelpModal = true" />
          <button @click="triggerImportFile" type="button">
            导入模型
          </button>
          <button @click="showAllObjSelect = true" type="button">
            对象列表({{ allObjCount }})
          </button>
          <button @click="showEnvironmentEditor = true" type="button">
            环境
          </button>
          <input type="file" id="fileInput" ref="loadProgramFileInputRef" accept=".devt" style="display: none"
            @change="handleLoadProgramFileChange" />
          <input type="file" id="importFileInput" ref="importFileInputRef" accept=".fbx,.obj" style="display: none"
            @change="handleImportFileChange" />
        </div>
        <div class="canvas-container">
          <!-- <Canvas3D ref="canvas3DRef1" :world="worldApi" v-model:cameraState="cameraStateLeft"
            :aspectRatio="aspectRatio1" :showCamera="true" cameraType="orthographic" /> -->
          <canvas ref="canvas2DRef" class="drawing-canvas" :style="{ display: isSplitting ? 'none' : 'block' }" />
          <canvas id="canvas2D2" ref="canvas2D2Ref" @click="handleCanvasClick" @mousedown="handleMouseDown"
            @mousemove="handleMouseMove" @mouseleave="handleMouseLeave" @mouseup="handleMouseUp"
            @contextmenu="handleContextMenu" @wheel="handleWheel" class="drawing-canvas"
            :style="{ display: isSplitting ? 'none' : 'block' }" />
        </div>
      </div>

      <div class="split-bar" @mousedown.prevent="startSplit(1)"></div>

      <div class="right-panel" :style="{ width: panel2SplitWidthPer * 100 + '%' }">
        <div class="tools">
          <div style="flex-shrink: 0;">全景图</div>
        </div>
        <!-- {{ insertTempDoor }} -->
        <div class="center-panel-content">
          <Canvas3D ref="canvas3DRefCenter" :world="worldApi" v-model:cameraState="cameraStateCenter"
            :camera="centerPanelCamera" :aspectRatio="aspectRatio2" :showCamera="true" cameraType="perspective"
            @objectHover="handleObjectHover" @objectClick="handleObjectClick" />
        </div>
      </div>

      <div class="split-bar" @mousedown.prevent="startSplit(2)"></div>
      <div class="right-panel" :style="{ width: (1 - panel1SplitWidthPer - panel2SplitWidthPer) * 100 + '%' }">
        <div class="tools">
          <div style="flex-shrink: 0;">摄像机：</div>
          <div class="cameraList">
            <div v-for="(item, index) in allCamera" @click="changeCamera2State(index)"
              :class="{ active: activeCameraIndex === index }" class="cameraItem">{{ index + 1 }}
            </div>
          </div>
          <div class="buttons" v-if="allCamera.length && cameraRightState">
            <button type="button" @click="showAiPic">AI渲染</button>
            <button type="button" @click="exportImage">导出图片</button>
          </div>
        </div>
        <div class="right-panel-content">
          <Canvas3D v-if="allCamera.length && cameraRightState && rightPanelCamera" ref="canvas3DRef2" :world="worldApi"
            :camera="rightPanelCamera" :cameraState="cameraRightState"
            :aspectRatio="cameraRightState.aspectW / cameraRightState.aspectH" :showCamera="false"
            cameraType="perspective" />
          <div v-else class="noCamera">请至少在场景中添加一个摄像机</div>
        </div>
      </div>
      <DataTypeEditPanel v-if="contextMenu?.visible && editPropTypeKey" :typeKey="editPropTypeKey"
        :editPropConfigInfo="editPropConfigInfo" v-model="editPropInputInfo"
        :initPosition="{ x: contextMenu.x, y: contextMenu.y }" @deleteContextMenuEntity="deleteContextMenuEntity"
        @close="contextMenu = null" @copyEntity="copyEntity" />
      <AllWorldObjSelect v-if="showAllObjSelect" :zoom2DLevel="zoom2DLevel" :panOffset="panOffset"
        @close="showAllObjSelect = false" @locationPosition="handleLocationPosition" @onChange="handleObjChange" />
      <EnvironmentEditor v-if="showEnvironmentEditor" @close="showEnvironmentEditor = false" />
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
        <div class="demoItem" v-if="!onlyDemos" @click="showDemos = false, loadProgramFile()">
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
  <Help v-if="showHelpModal" @close="showHelpModal = false" />
  <div v-if="initWorldLoading" class="globalLoading">...</div>
  <teleport to="#teleport" v-if="insertAdding">
    <div class="loadingContent">
      <img class="loadingIcon" src="../assets/loading_white.svg" alt="loading" />
      <!-- <div>模型初始化中，请稍后...</div> -->
    </div>
  </teleport>
  <teleport to="#teleport" v-if="isShowAiPic">
    <AiPic :initial-image="aiPicInitialImage" :image-size="{
      width: aiPicSize.width,
      height: aiPicSize.height,
    }" @close="isShowAiPic = false" />
  </teleport>
  <ShowPayModal v-if="showPayModal" @close="showPayModal = false" @paySuccess="handlePaySuccess" />
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import axios from 'axios'
import * as THREE from 'three'
import JSZip from 'jszip';
import request from '@/utils/request'
import { Point } from '../types'
import { snapThreshold, Group, EnvironmentConfig } from '../utils/world/entity'
import Canvas3D from '../components/Canvas3D.vue'
import { CameraState } from '@/types/camera'
import { allFileKeys, fileData, editItem } from '@/entities'
import { PointEntityClass } from '@/types/pointEntity'
import { EntityClassInWall } from '@/types/entityInWall'
import { BaseObjData, HandelInfo, LineObjData } from '@/types/map2d'
import pointToLineDistance from '@/utils/pointToLineDistance'
import { getClosestPointOnLine } from '@/utils/geometry'
import { CameraData } from '@/entities/camera/index.d'
import { WallEntity } from '@/entities/wall/entity'
import { ImportFileType, ObjOutputFileType } from '@/entities/allObjs'
import ObjTypeSelect from '@/components/ObjTypeSelect.vue'
import EnvironmentEditor from '@/components/EnvironmentEditor.vue'
import { ImportFileData } from '@/entities/importFile/index.d';
import Login from '@/components/Login.vue'
import { useStore } from 'vuex';
import { Store } from '@/store';
import Help from '@/components/help.vue'
import { MatchCircleArea, MatchRectArea } from '@/utils/matchArea';
import processUploadedFile from '@/utils/processUploadedFile';
import DataTypeEditPanel from './DataTypeEditPanel.vue'
import { BaseEntityClass } from '@/types/baseEntity';
import { LineEntityClass } from '@/types/lineEntity';
import AllWorldObjSelect from '@/components/AllWorldObjSelect.vue'
import message from '@/utils/message';
import getNearestWall from '@/utils/getNearestWall';
import getSnapPointAndLine from '@/utils/getSnapPoint';
import importOutObj from '@/utils/importOutObj';
import { CameraBase } from '@/types/CameraBase';
import { sleep } from '@/utils/sleep';
import saveWorld from '@/utils/saveWorld';
import { getHandleInAreaInfoByXY, getHandleInfoByXY } from '@/utils/getHandleInfoByXY';
import AiPic from '@/components/aiPic.vue'
import ShowPayModal from '@/components/showPayModal.vue'
import drawAxes from '@/utils/drawAxes';
import WorldState from '@/utils/worldState';

const canvas2DRef = ref<HTMLCanvasElement | null>(null)
const canvas2D2Ref = ref<HTMLCanvasElement | null>(null)
const canvas3DRef1 = ref<typeof Canvas3D | null>(null)
const canvas3DRefCenter = ref<typeof Canvas3D | null>(null)
const canvas3DRef2 = ref<typeof Canvas3D | null>(null)
const activeToolsIndex = ref(-1)
const currentTool = ref<string | 'drag'>('drag')
// 所有用连续点作为创建的元素的那个点阵
const tempPointInsertData = ref<{
  x: number
  y: number
}[]>([])
const hoverPoint = ref<Point | null>(null)
const lastPoint = ref<Point | null>(null)
const xAxisSnappedY = ref<number | null>(null)
const yAxisSnappedX = ref<number | null>(null)
const dragOffset = ref<Point | null>(null)
const dragStartPoint = ref<Point | null>(null)
const panOffset = ref<Point>({ x: 0, y: 0 })
const isPanningScreen = ref(false);// 平移屏幕
const panel1SplitWidthPer = ref(0.35)
const panel2SplitWidthPer = ref(0.35)
const isSplitting = ref(false)
const canvasSize = ref({ width: 0, height: 0 })
const zoom2DLevel = ref(1)

const showLogin = ref(false)
const showDemos = ref(false)
const onlyDemos = ref(false)
const showHelpModal = ref(false)
const initWorldLoading = ref(false)

const allDemos = ref<any[]>([])
const demoIniting = ref(false)

// 拖拽上传相关状态
const isDragOver = ref(false)

const store = useStore<Store>()
const aspectRatio1 = ref(1)
const aspectRatio2 = ref(1)

const cameraStateCenter = ref<CameraState>({
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
const cameraRightState = ref<CameraState | null>(null)
const lockObjCount = ref(0)
const allObjCount = ref(0)
const isShowAiPic = ref(false)
const aiPicInitialImage = ref('')
const aiPicSize = ref({
  width: 1024,
  height: 768,
})
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
let menuEntity: BaseEntityClass<any> | null = null
let menuEntiryHandelInfo: HandelInfo | null = null;// 选中的对象的柄信息
let beCopyEntity: BaseEntityClass<any> | null = null;// 被复制移动中的对象
let beCopyEntityHandelInfo: HandelInfo & Point | null = null;// 被复制移动中的对象的柄信息(非引用，是拷贝)
let insertTempObj: BaseEntityClass<any> | null = null
const insertAdding = ref(false)

const centerPanelCamera = ref(new THREE.PerspectiveCamera(55, aspectRatio2.value, 0.1, 20000));
const rightPanelCamera = ref<THREE.PerspectiveCamera | THREE.OrthographicCamera>();

const showPayModal = ref(false)

let panStartScreenX = 0
let panStartScreenY = 0

const updateCanvasSize = () => {
  const container = document.querySelector('.map2d-container')
  if (!container) return
  const ctxList = [
    canvas2DRef.value!,
    canvas2D2Ref.value!
  ];
  const canvasContainer = document.querySelector('.canvas-container')
  if (canvasContainer) {
    const canvasRect = canvasContainer.getBoundingClientRect()
    const width = Math.floor(canvasRect.width)
    const height = Math.floor(canvasRect.height)

    if (width > 0 && height > 0) {
      ctxList.forEach(ctx => {
        if (ctx) {
          ctx.width = width
          ctx.height = height
        }
      })
      canvasSize.value = { width, height }
    }
  }
  const leftCanvasContainer = document.querySelector('.canvas-container')
  if (leftCanvasContainer) {
    const canvasRect = leftCanvasContainer.getBoundingClientRect()
    const width = Math.floor(canvasRect.width)
    const height = Math.floor(canvasRect.height)
    if (width > 0 && height > 0) {
      aspectRatio1.value = width / height
    }
  }
  if (canvas3DRefCenter.value) {
    const centerPanelContainer = document.querySelector('.center-panel-content')
    if (centerPanelContainer) {
      const canvasRect = centerPanelContainer.getBoundingClientRect()
      const width = Math.floor(canvasRect.width)
      const height = Math.floor(canvasRect.height)

      if (width > 0 && height > 0) {
        aspectRatio2.value = width / height
      }
    }
  }

  const canvas3DPanel = canvas3DRefCenter.value
  if (canvas3DPanel) {
    canvas3DPanel.resize();
  }
  const canvas3DPanel2 = canvas3DRef2.value
  if (canvas3DPanel2) {
    canvas3DPanel2.resize();
  }
  setTimeout(() => {
    drawWrapper2DAnd3D()
  }, 30)
}

const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  type: string;
  index: number;
  wallIndex?: number;
  pointIndex?: number;
  thickness?: number
} | null>(null)

const editPropConfigInfo = ref<editItem[]>([])
const editPropInputInfo = ref<any>({})
const editPropTypeKey = ref<string>()
const editSnapPoint = ref<HandelInfo>()
const editPropTypeIndex = ref<number>(-1)
const showAllObjSelect = ref(false)
const showEnvironmentEditor = ref(false)

function getTempPointInsertDataLastAngel() {
  if (tempPointInsertData.value.length && tempPointInsertData.value.length >= 2) {
    const prevPoint = tempPointInsertData.value[tempPointInsertData.value.length - 2]
    const lastPoint = tempPointInsertData.value[tempPointInsertData.value.length - 1]

    const prevAngleDeg = Math.atan2(lastPoint.y - prevPoint.y, lastPoint.x - prevPoint.x) * 180 / Math.PI

    let perpendicularAngle1 = prevAngleDeg + 90
    let perpendicularAngle2 = prevAngleDeg - 90

    if (perpendicularAngle1 > 180) perpendicularAngle1 -= 360
    if (perpendicularAngle1 < -180) perpendicularAngle1 += 360
    if (perpendicularAngle2 > 180) perpendicularAngle2 -= 360
    if (perpendicularAngle2 < -180) perpendicularAngle2 += 360
    return [perpendicularAngle1, perpendicularAngle2]
  } else {
    return []
  }
}

const worldState = new WorldState()
window.worldState = worldState

const worldApi = new Group(null, {
  id: 'world',
  x: 0,
  y: 0,
  z: 0,
  childrenData: [
  ],
  angleY: 0,
})
window.worldApi = worldApi

allObjCount.value = worldApi.getAllObjectCount()
const drawWrapper2DAnd3D = () => {
  drawWrapper2D();
  worldApi.draw3D()
}
const drawWrapper2D = () => {
  const canvas = canvas2DRef.value
  const canvasAction = canvas2D2Ref.value;
  if (canvas && canvasAction && canvas.getContext('2d')) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvasSize.value.width, canvasSize.value.height)
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvasSize.value.width, canvasSize.value.height)
    worldApi.draw2DPreview(
      ctx,
      panOffset.value,
      zoom2DLevel.value,
    )
    // 绘制轴
    drawAxes(ctx, panOffset.value, zoom2DLevel.value, canvasSize.value.width, canvasSize.value.height)
    // 绘制磁吸点的参考轴
    if (hoverPoint.value) {
      (() => {
        if (!ctx) return
        ctx.strokeStyle = '#999'
        ctx.lineWidth = 1

        // 垂直线（y轴对齐）
        if (yAxisSnappedX.value !== null) {
          const screenX = yAxisSnappedX.value * zoom2DLevel.value + panOffset.value.x
          ctx.beginPath()
          ctx.moveTo(screenX, 0)
          ctx.lineTo(screenX, canvasSize.value.height)
          ctx.stroke()
        }

        // 水平线（x轴对齐）
        if (xAxisSnappedY.value !== null) {
          const screenY = xAxisSnappedY.value * zoom2DLevel.value + panOffset.value.y
          ctx.beginPath()
          ctx.moveTo(0, screenY)
          ctx.lineTo(canvasSize.value.width, screenY)
          ctx.stroke()
        }
      })();
    }
    if (ctx && insertTempObj) {
      if (insertTempObj instanceof LineEntityClass) {
        insertTempObj.draw2DPreview(ctx, panOffset.value, zoom2DLevel.value)
        insertTempObj.draw2DActionHandle(ctx, panOffset.value, zoom2DLevel.value)
      } else if (insertTempObj instanceof PointEntityClass) {
        insertTempObj.draw2DPreview(ctx, panOffset.value, zoom2DLevel.value)
        insertTempObj.draw2DActionHandle(ctx, panOffset.value, zoom2DLevel.value)
      }
    }
  }
}

const activeCameraIndex = ref(0)
async function changeCamera2State(activeIndex: number = 0) {
  const allCameraTypeKey = ['camera', 'directionCamera'];
  const allTypesCameraList: CameraData[] = []
  const allTypesCameraObjList: CameraBase<CameraData>[] = []
  allCameraTypeKey.forEach(typeKey => {
    if (worldApi.getTypeListEntity(typeKey)) {
      worldApi.getTypeListEntity(typeKey).forEach(item => {
        if (item instanceof CameraBase) {
          allTypesCameraObjList.push(item);
        }
      })
    }
    console.log('typeKey=======', typeKey, worldApi.getTypeObjectsData(typeKey))
    allTypesCameraList.push(...worldApi.getTypeObjectsData(typeKey) as CameraData[]);
  })

  if (allTypesCameraList) {
    // cameraRightPanel.value = allTypesCameraList[activeIndex];
    await sleep(10);
    const allCameraList: CameraState[] = [];
    (allTypesCameraList as CameraData[]).forEach(cameraData => {
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
    cameraRightState.value = allCameraList[activeIndex]
    // if (allCameraList[activeIndex]) {
    //   if (!cameraRightPanel.value) {
    //     cameraRightPanel.value = new THREE.PerspectiveCamera(55, cameraRightState.value.aspectW / cameraRightState.value.aspectH, 0.1, 20000);
    //     await sleep(10);
    //   }
    //   if ('fov' in allCameraList[activeIndex]) {
    //     console.log('xxxxx-1')
    //     cameraRightPanel.value.position.set(
    //       allCameraList[activeIndex].positionX,
    //       allCameraList[activeIndex].positionZ,
    //       allCameraList[activeIndex].positionY,
    //     )
    //     cameraRightPanel.value.lookAt(
    //       allCameraList[activeIndex].targetPositionX,
    //       allCameraList[activeIndex].targetPositionZ,
    //       allCameraList[activeIndex].targetPositionY
    //     );
    //     cameraRightPanel.value.updateProjectionMatrix()
    //   }
    // }
    activeCameraIndex.value = activeIndex
    worldState.activeCameraIndex = activeIndex
    const allCameraObjList: BaseEntityClass<BaseObjData>[] = [];
    allCameraTypeKey.forEach(typeKey => {
      const typeItemList = worldApi.getTypeListEntity(typeKey);
      if (typeItemList) {
        allCameraObjList.push(...typeItemList);
      }
    })
    if (allCameraObjList) {
      allCameraObjList.forEach((cameraItem, index) => {
        if (index === activeIndex) {
          // @ts-ignore
          if (cameraItem.active === false) {
            // @ts-ignore
            cameraItem.active = true
            cameraItem.markObjectIsDirty()
          }
        } else {
          // @ts-ignore
          if (cameraItem.active === true) {
            // @ts-ignore
            cameraItem.active = false
            cameraItem.markObjectIsDirty()
          }
        }
      })
      drawWrapper2DAnd3D()
    }
    // console.trace('ddddddd')
    // console.log('cameraRightPanel---1', cameraRightPanel.value)
    if (allTypesCameraObjList[activeIndex] && allTypesCameraObjList[activeIndex].realyCamera) {
      // console.log('cameraRightPanel---2', cameraRightPanel.value)
      rightPanelCamera.value = allTypesCameraObjList[activeIndex].realyCamera
    }
  } else {
    allCamera.value = []
    cameraRightState.value = null
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

  worldApi.onWorldChange((type, objList) => {
    if (['add', 'remove'].includes(type)) {
      allObjCount.value = worldApi.getAllObjectCount();
    } else if (type === 'change') {
      // console.log('contextMenu', objList)
      if (contextMenu.value && contextMenu.value.visible) {
        // console.log('contextMenu', objList)
        const type = contextMenu.value.type
        const index: number = contextMenu.value.index
        const find = objList.find((v) => {
          if (v.type === type) {
            const typeList = window.worldApi.getTypeListEntity(type)
            if (typeList) {
              const obj = typeList[index]
              if (obj === v) {
                return true;
              }
            }
          }
          return false
        })
        if (find) {
          const allKey = Object.keys(editPropInputInfo.value)
          const getData: Record<string, any> = find.getData()
          allKey.forEach((key: string) => {
            if (key in getData && key in editPropInputInfo.value) {
              if (editPropInputInfo.value[key] !== getData[key]) {
                editPropInputInfo.value[key] = getData[key]
              }
            }
          })
        }
      }
    }
    lockObjCount.value = worldApi.lockedObjList.length
    const findCamera = objList.find((item) => item instanceof CameraBase)
    if (findCamera) {
      if (type === 'remove' && activeCameraIndex.value === allCamera.value.length - 1) {
        activeCameraIndex.value = 0;
      }
      // console.log('allCamera-d', allCamera.value.length, activeCameraIndex.value)
      changeCamera2State(activeCameraIndex.value)
    }
  })
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
      drawWrapper2DAnd3D()
    }
    const match = location.href.match(/initId=(\d+)/);
    if (match) {
      import('@/utils/initByObjId').then(({ default: initByObjId }) => {
        const data = initByObjId(Number(match[1]))
        initWorldByData(data).finally(() => {
          showDemos.value = false
          demoIniting.value = false
        })
      })
    }
  })
  drawWrapper2DAnd3D()
  window.addEventListener('resize', () => updateCanvasSize())
  updateCanvasSize()
  function bindSave(event: any) {
    console.log('event', event)
    // 检测 Ctrl+S (Windows/Linux) 或 Command+S (Mac)
    if ((event.ctrlKey || event.metaKey)) {
      if (event.key === 's') {
        event.preventDefault(); // 阻止浏览器保存网页
        saveDrawing();
      } else if (event.key === 'z') {
        console.log('撤销一步')
        if (insertTempObj && insertTempObj instanceof LineEntityClass) {
          const data = insertTempObj.getData()
          if (tempPointInsertData.value.length === 1) {
            insertTempObj = null;
            tempPointInsertData.value = []
            lastPoint.value = null
            hoverPoint.value = null
            message.info('退出绘制')
          } else {
            // tempPointInsertData去掉最后一项
            tempPointInsertData.value.pop()
            data.points = tempPointInsertData.value;
            insertTempObj.setData(data)
            drawWrapper2D();
          }
        }
      }
    }
  }
  // 劫持Ctrl+S保存事件
  window.addEventListener('keydown', bindSave);

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (insertTempObj && currentTool.value !== 'drag') {
        if (insertTempObj instanceof LineEntityClass) {
          insertAdding.value = true
          insertTempObj.setPreparePoint(tempPointInsertData.value)
          const insertData = insertTempObj.getData()
          if (tempPointInsertData.value.length >= 2) {
            await worldApi.add(currentTool.value, [insertData])
          }
          insertTempObj = null;
          tempPointInsertData.value = []
          lastPoint.value = null
          hoverPoint.value = null
          setTimeout(() => {
            insertAdding.value = false
          }, 300)// 至少停留300毫秒，防止出现那种闪现的效果。
        } else {
          insertTempObj = null;
        }
      }
      drawWrapper2DAnd3D()
      currentTool.value = 'drag'
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keydown', bindSave);
  }
})

const loadProgramFileInputRef = ref<HTMLInputElement | null>(null)
const importFileInputRef = ref<HTMLInputElement | null>(null)

const triggerImportFile = () => {
  importFileInputRef.value?.click()
}

const handleImportFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  await importOutObj2(file)
}

const saveDrawing = async () => {
  if (!store.state.main.userInfo) {
    alert('请先登录')
    showLogin.value = true
    return
  }
  activeToolsIndex.value = -1
  await saveWorld(
    panOffset.value,
    zoom2DLevel.value,
    cameraStateCenter.value,
    activeCameraIndex.value
  )
}

const loadProgramFile = () => {
  activeToolsIndex.value = -1
  loadProgramFileInputRef.value?.click()
}

const handleLoadProgramFileChange = async (e: Event) => {
  worldApi.clearAll()
  initWorldLoading.value = true
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    initWorldLoading.value = false
    return
  }

  // 1. 解压 ZIP
  const zip = await JSZip.loadAsync(file);
  const t = await zip.file('scene.json');
  if (!t) {
    initWorldLoading.value = false
    return
  }
  // 2. 读取 scene.json
  const sceneJsonText = await t.async('string');
  const sceneData: {
    importFile: ImportFileType[]
    allImportImgs: string[]
  } = JSON.parse(sceneJsonText);

  console.log('sceneData', sceneData)
  if (sceneData.importFile && sceneData.importFile.length) {
    for (const v of sceneData.importFile) {
      const { fileTypeId } = v
      const read = await zip.file(`assets/${fileTypeId}`);
      const extension = fileTypeId.split('.').pop()?.toLowerCase();
      if (!read) continue
      const blob = await read.async('blob');
      const url = URL.createObjectURL(blob);
      const file = new File([blob], fileTypeId, { type: blob.type || 'application/octet-stream' })

      console.log('blob', blob, url, file, file.name, extension)
      processUploadedFile(file, (object: THREE.Group, file: File) => {
        const customObjItem: ImportFileType = {
          fileTypeId: v.fileTypeId,
          mesh: object,
          file,
        }
        window.worldState.allImportFiles.push(customObjItem)
      })
    }
  }

  if (sceneData.allImportImgs && sceneData.allImportImgs.length) {
    for (const fileTypeId of sceneData.allImportImgs) {
      console.log('fileTypeId', fileTypeId)
      const read = await zip.file(`imgs/${fileTypeId}`);
      if (!read) continue
      const blob = await read.async('blob');
      const file = new File([blob], fileTypeId, { type: blob.type || 'application/octet-stream' })
      window.worldState.allImportImgs.push({ fileTypeId, file })
    }
  }
  try {
    const data: fileData & {
      panOffset: Point
      zoomLevel: number
      cameraState: CameraState
      activeCameraIndex: number
      environmentConfig?: EnvironmentConfig
    } = JSON.parse(sceneJsonText as string)
    initWorldLoading.value = true
    await initWorldByData(data)
    initWorldLoading.value = false
  } catch (error) {
    initWorldLoading.value = false
    console.error(error)
  }
  input.value = ''
}

async function initWorldByData(data: fileData & {
  panOffset: Point
  zoomLevel: number
  cameraState: CameraState
  activeCameraIndex: number
  environmentConfig?: EnvironmentConfig
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
    window.worldState.ObjFileTypes.push(v)
  })

  for (let i = 0; i < allFileKeys.length; i++) {
    const key = allFileKeys[i]
    if (data[key] && data[key].length > 0) {
      await worldApi.add(key, data[key])
    }
  }

  panOffset.value = data.panOffset || { x: 0, y: 0 }
  zoom2DLevel.value = data.zoomLevel || 1
  if (data.cameraState) {
    cameraStateCenter.value = data.cameraState
  }
  if (data.activeCameraIndex !== undefined) {
    await changeCamera2State(data.activeCameraIndex)
  }
  if (data.environmentConfig) {
    window.worldState.setEnvironMent(data.environmentConfig)
  }
  drawWrapper2DAnd3D()
}

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()

  const canvas = canvas2DRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)
  const x = (screenX - panOffset.value.x) / zoom2DLevel.value
  const y = (screenY - panOffset.value.y) / zoom2DLevel.value

  editPropConfigInfo.value = []
  editPropInputInfo.value = {}
  editPropTypeIndex.value = -1
  const sortAllFileKeys = ([...allFileKeys]).reverse();

  for (let i = 0; i < sortAllFileKeys.length; i++) {
    const type = sortAllFileKeys[i]
    if (sortAllFileKeys.includes(type)) {
      if (!worldApi.getTypeListEntity(type)) {
        continue
      }
      for (let j = 0; j < worldApi.getTypeObjectsData(type).length; j++) {
        const api: BaseEntityClass<any> = worldApi.getTypeListEntity(type)[j]
        const snapPoint = api.matchHandelInfo(x, y)
        if (snapPoint) {
          menuEntity = api
          menuEntiryHandelInfo = snapPoint;
          if (api.getData().isLocked) {
            message.warning('锁定对象不能编辑，请去[对象列表]解锁', { position: 'top-center' })
            continue
          }
          api.editPropConfig(snapPoint, (propConfig, callback) => {
            console.log('dist', propConfig)
            const contextMenuX = e.clientX
            const contextMenuY = e.clientY
            editSnapPoint.value = snapPoint
            editPropTypeKey.value = type
            editPropTypeIndex.value = j
            const modifyConfig: editItem[] = [...propConfig];
            if (api instanceof PointEntityClass) {
              modifyConfig.push({
                id: 'tipGroup',
                label: '提示信息',
                dataType: 'title',
              })
              modifyConfig.push({
                id: 'tip',
                label: '提示信息',
                dataType: 'string',
                value: api.getData().tip || '',
              })
              modifyConfig.push({
                id: 'tipFontSize',
                label: '提示信息字号',
                dataType: 'number',
                min: 1,
                max: 120,
                step: 1,
                value: api.getData().tipFontSize || 96,
              })
            }
            editPropConfigInfo.value = modifyConfig
            const inputData: any = {}
            modifyConfig.forEach(v => {
              if (v.dataType !== 'title') {
                inputData[v.id] = v.value
              }
            })
            inputData.isLocked = api.getData().isLocked || false
            console.log('初始化数据', inputData)
            editPropInputInfo.value = inputData;
            nextTick(() => {
              contextMenu.value = {
                visible: true,
                x: contextMenuX,
                y: contextMenuY,
                // @ts-ignore
                type,
                index: j
              }
              editPropConfigEditCallback = (val: any) => {
                callback(val)
                drawWrapper2DAnd3D()
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
          }, () => {
            contextMenu.value = null
            drawWrapper2DAnd3D()
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
    worldApi.delete(type, contextMenu.value.index)
  }
  contextMenu.value = null
  drawWrapper2DAnd3D()
}

const handleCanvasClick = async (e: MouseEvent) => {
  if (beCopyEntity) {
    if (beCopyEntity instanceof LineEntityClass) {
      beCopyEntity.applyOffsetToData()
    }
    beCopyEntity = null
    beCopyEntityHandelInfo = null
    drawWrapper2DAnd3D()
    return
  }
  // 如果当前是拖拽模式，不执行任何操作
  if (currentTool.value === 'drag') {
    return
  }
  const canvas = canvas2DRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)
  const x = (screenX - panOffset.value.x) / zoom2DLevel.value
  const y = (screenY - panOffset.value.y) / zoom2DLevel.value

  // 点击空白处隐藏 context menu
  if (contextMenu.value) {
    contextMenu.value = null
    return
  }

  if (insertTempObj && insertTempObj instanceof LineEntityClass) {
    const data = insertTempObj.getData()
    if (hoverPoint.value) {
      tempPointInsertData.value.push({
        x: Math.round(hoverPoint.value.x),
        y: Math.round(hoverPoint.value.y)
      })
    } else {
      tempPointInsertData.value.push({
        x: Math.round(x),
        y: Math.round(y)
      })
    }
    data.points = tempPointInsertData.value;
    insertTempObj.setData(data)
    drawWrapper2D();
  } else if (insertTempObj && insertTempObj instanceof PointEntityClass) {
    if (insertTempObj instanceof EntityClassInWall) {
      if (hoverPoint.value && insertAdding.value === false) {
        insertAdding.value = true
        await worldApi.add(currentTool.value, [insertTempObj.getData()])
        insertTempObj = null;
        setTimeout(() => {
          insertAdding.value = false
        }, 300)// 至少停留300毫秒，防止出现那种闪现的效果。
        currentTool.value = 'drag'
      }
    } else {
      if (insertAdding.value === false) {
        insertAdding.value = true
        await worldApi.add(currentTool.value, [insertTempObj.getData()])
        insertTempObj = null;
        setTimeout(() => {
          insertAdding.value = false
        }, 300)// 至少停留300毫秒，防止出现那种闪现的效果。
        currentTool.value = 'drag'
      }
    }
  }

  drawWrapper2DAnd3D()
}

const clearDrawing = () => {
  if (confirm('确定要清空所有绘制内容吗？')) {
    worldApi.clearAll();
    drawWrapper2DAnd3D()
    activeToolsIndex.value = -1
  }
}

const handleLogin = (email: string, password: string) => {
  console.log('Login attempt:', email, password)
  showLogin.value = false
  initUserInfo();
}

const initUserInfo = () => {
  request.get('/video/user/info').then(res => {
    console.log(res)
    if (res.status === 200) {
      store.dispatch('main/setUserInfo', res.data)
    }
  }).catch(() => {
    store.dispatch('main/setUserInfo', null)
  })
}

const handleMouseMove = (e: MouseEvent) => {
  const canvas = canvas2DRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)
  const x = (screenX - panOffset.value.x) / zoom2DLevel.value
  const y = (screenY - panOffset.value.y) / zoom2DLevel.value
  if (beCopyEntity) {
    if (beCopyEntity instanceof PointEntityClass) {
      beCopyEntity.changePosition({ x, y })
      drawWrapper2DAnd3D()
    } else if (beCopyEntity instanceof LineEntityClass) {
      if (beCopyEntityHandelInfo) {
        console.log('beCopyEntityHandelInfo', x - beCopyEntityHandelInfo.x)
        beCopyEntity.offset.x = x - beCopyEntityHandelInfo.x
        beCopyEntity.offset.y = y - beCopyEntityHandelInfo.y
        drawWrapper2DAnd3D()
      }
    }
  }
  if (currentTool.value === 'drag') { // drag代表拖拽和鼠标移动
    const canvasAction = canvas2D2Ref.value!;
    // 绘制操作句柄
    const ctxAction = canvasAction.getContext('2d')!
    // 如果正在拖拽，处理拖拽逻辑（即使当前工具不是 drag）
    if (matchHandelObj && matchedHandelInfo) {
      // console.log('MatchSnapPoint-3-2')
      function temp(wall: WallEntity): boolean {
        // if (wall === matchHandelObj) {
        //   return false;
        // }
        if (matchHandelObj && matchedHandelInfo) {
          const beMatchPoints = wall.getMineBeSnapPoints(matchedHandelInfo)
          if (beMatchPoints.length > 0) {
            const snapped33 = getSnapPointAndLine(
              { x, y },
              [],
              [],
              beMatchPoints,
            )
            if (snapped33 !== null) {
              xAxisSnappedY.value = snapped33.xAxisSnappedY || null
              yAxisSnappedX.value = snapped33.yAxisSnappedX || null
              const result = matchHandelObj.inSceneSnapPointArea(
                {
                  objType: wall.type,
                  snapFromType: 'point',
                  point: snapped33.point
                },
                matchedHandelInfo,
              )
              if (result) {
                drawWrapper2DAnd3D()
                return true;
              }
            }
          }
          const beMatchLines = wall.getMineBeSnapLines()
          if (beMatchLines.length > 0 && matchHandelObj instanceof PointEntityClass) {
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
                const result2 = matchHandelObj.inSceneSnapLineArea(wall, matchLine, nearestPoint)
                if (result2) {
                  drawWrapper2DAnd3D()
                  return true;
                }
              }
            }
          }
        }
        return false;
      }
      if (worldApi.getTypeListEntity('wall')) {
        for (let i = 0; i < worldApi.getTypeObjectsData('wall').length; i++) {
          const api: WallEntity = worldApi.getTypeListEntity('wall')[i] as WallEntity;
          // 类型“WallEntity”的参数不能赋给类型“BaseEntityClass<PointObjData>”的参数。
          if (temp(api)) {
            // 绘制操作句柄
            ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
            matchHandelObj.draw2DActionHandle(ctxAction, panOffset.value, zoom2DLevel.value)
            return;
          }
        }
      }
      if (matchHandelObj instanceof PointEntityClass) {
        matchHandelObj.notInSceneSnapLineArea()
      }
      const tipTexts = matchHandelObj.matchHandelMoveCallback({
        x,
        y,
        startX: matchHandelStartPoint ? matchHandelStartPoint.x : undefined,
        startY: matchHandelStartPoint ? matchHandelStartPoint.y : undefined,
      }, matchedHandelInfo)
      drawWrapper2D();
      // 绘制操作句柄
      ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
      matchHandelObj.draw2DActionHandle(ctxAction, panOffset.value, zoom2DLevel.value)
      worldApi.draw3D()
      if (tipTexts && tipTexts.length > 0) {
        const canvasAction = canvas2DRef.value!;
        const ctxAction = canvasAction.getContext('2d')!

        const hoverScreenX = x * zoom2DLevel.value + panOffset.value.x
        const hoverScreenY = y * zoom2DLevel.value + panOffset.value.y
        const startY = hoverScreenY + 14;
        // 绘制一个背景矩形
        ctxAction.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctxAction.fillRect(hoverScreenX - 60, startY, 120, 8 + 15 * tipTexts.length);
        ctxAction.font = '14px Arial'
        ctxAction.textBaseline = 'middle'
        ctxAction.strokeStyle = 'white'
        ctxAction.fillStyle = 'white'
        ctxAction.textAlign = 'center'
        tipTexts.forEach((v, index) => {
          ctxAction.fillText(v, hoverScreenX, startY + 15 * index + 13)
        })
      }
      return;
    }
    if (isPanningScreen.value) {
      const dx = screenX - panStartScreenX
      const dy = screenY - panStartScreenY
      panOffset.value.x += dx
      panOffset.value.y += dy
      panStartScreenX = screenX
      panStartScreenY = screenY
      drawWrapper2D()
      // 绘制操作句柄
      ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
    } else {
      // 鼠标浮动而过
      ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
      const handleInfo = getHandleInAreaInfoByXY(x, y)
      if (handleInfo) {
        const { classInfo, matchArea } = handleInfo
        const textPositionX = x;
        const textPositionY = y - 10;
        if (matchArea instanceof MatchRectArea) {
          ctxAction.lineWidth = 2
          ctxAction.strokeStyle = 'red'
          ctxAction.save(); // 保存当前状态
          ctxAction.translate(
            matchArea.data.x * zoom2DLevel.value + panOffset.value.x,
            matchArea.data.y * zoom2DLevel.value + panOffset.value.y
          ); // 移动原点到目标中心
          ctxAction.rotate(matchArea.data.angleY * -1); // 围绕新原点旋转
          // 绘制一个方块
          ctxAction.strokeRect(
            matchArea.data.width / -2 * zoom2DLevel.value,
            matchArea.data.depth / -2 * zoom2DLevel.value,
            matchArea.data.width * zoom2DLevel.value,
            matchArea.data.depth * zoom2DLevel.value,
          )
          ctxAction.restore(); // 恢复原始状态
        } else if (matchArea instanceof MatchCircleArea) {
          ctxAction.lineWidth = 2
          ctxAction.strokeStyle = 'red'
          ctxAction.save(); // 保存当前状态
          ctxAction.translate(
            matchArea.data.x * zoom2DLevel.value + panOffset.value.x,
            matchArea.data.y * zoom2DLevel.value + panOffset.value.y
          );
          // 绘制一个圆
          ctxAction.beginPath()
          ctxAction.arc(
            0,
            0,
            matchArea.data.r * zoom2DLevel.value,
            0,
            Math.PI * 2,
          )
          ctxAction.stroke()
          ctxAction.restore(); // 恢复原始状态
        }
        classInfo.draw2DActionHandle(ctxAction, panOffset.value, zoom2DLevel.value)

        if (classInfo instanceof PointEntityClass) {
          // 绘制文字（带边框）
          ctxAction.font = `${Math.max(14 * zoom2DLevel.value, 14)}px '微软雅黑'`
          ctxAction.textAlign = 'center'
          // 设置边框样式
          ctxAction.strokeStyle = 'white'
          ctxAction.lineWidth = 2
          const text = classInfo.inAreaHoverText()
          ctxAction.strokeText(
            text,
            textPositionX * zoom2DLevel.value + panOffset.value.x,
            textPositionY * zoom2DLevel.value + panOffset.value.y
          )
          // 设置填充样式
          ctxAction.fillStyle = 'black'
          ctxAction.fillText(
            `${text}`,
            textPositionX * zoom2DLevel.value + panOffset.value.x,
            textPositionY * zoom2DLevel.value + panOffset.value.y
          )
        }
      }
    }
  } else if (insertTempObj instanceof LineEntityClass) {
    if (tempPointInsertData.value && tempPointInsertData.value.length > 0) {
      const insertTempObjId = insertTempObj.getData().id;
      const last = tempPointInsertData.value[tempPointInsertData.value.length - 1]
      // 收集所有点（包括临时折线和已绘制的墙上的点）
      const allPoints = [...tempPointInsertData.value];
      (worldApi.getTypeObjectsData(currentTool.value) as LineObjData<any>[]).forEach((item: LineObjData<any>) => {
        item.points.forEach((point: any) => {
          allPoints.push(point)
        })
      })
      const snapAngles = [0, 45, 90, 135, 180, -135, -90, -45]
      snapAngles.push(...getTempPointInsertDataLastAngel())
      let snappedPoint44 = getSnapPointAndLine(
        { x, y },
        [{
          objType: currentTool.value,
          snapFromType: 'point',
          point: last
        }],
        snapAngles,
        allPoints.map(v => ({
          objType: currentTool.value,
          snapFromType: 'point',
          point: v
        })),
      )
      if (snappedPoint44 === null) {
        // console.log('===dist---find', snappedPoint44)
        snappedPoint44 = {
          objType: currentTool.value,
          snapFromType: 'point',
          point: { x, y },
          xAxisSnappedY: y,
          yAxisSnappedX: x,
        }
        xAxisSnappedY.value = null
        yAxisSnappedX.value = null
      } else {
        xAxisSnappedY.value = snappedPoint44.xAxisSnappedY
        yAxisSnappedX.value = snappedPoint44.yAxisSnappedX
      }
      const points = [...tempPointInsertData.value]
      if (!(Math.abs(snappedPoint44.point.x - last.x) < 3 && Math.abs(snappedPoint44.point.y - last.y) < 3)) {
        points.push(snappedPoint44.point)
      } else {
        // console.log('match point 99999', snappedPoint44.point.x, last.x, snappedPoint44.point.y, last.y)
      }
      const tipTexts = insertTempObj.setPreparePoint(points)
      hoverPoint.value = {
        x: snappedPoint44.point.x,
        y: snappedPoint44.point.y,
      }
      drawWrapper2DAnd3D()
      const hoverScreenX = hoverPoint.value.x * zoom2DLevel.value + panOffset.value.x
      const hoverScreenY = hoverPoint.value.y * zoom2DLevel.value + panOffset.value.y
      const canvasAction = canvas2DRef.value!;
      const ctxAction = canvasAction.getContext('2d')!
      const startY = snappedPoint44.point.y > last.y ? hoverScreenY + 14 : hoverScreenY - 15 * tipTexts.length - 22;
      if (tipTexts.length > 0) {
        // 绘制一个背景矩形
        ctxAction.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctxAction.fillRect(hoverScreenX - 50, startY, 100, 8 + 15 * tipTexts.length);
        ctxAction.font = '14px Arial'
        ctxAction.textBaseline = 'middle'
        ctxAction.strokeStyle = 'white'
        ctxAction.fillStyle = 'white'
        ctxAction.textAlign = 'center'
        tipTexts.forEach((v, index) => {
          ctxAction.fillText(v, hoverScreenX, startY + 15 * index + 13)
        })
      }
    }
  } else {
    const nearest = getNearestWall({ x, y })
    if (nearest) {
      hoverPoint.value = nearest.pointOnWall
    } else {
      hoverPoint.value = null
    }
    let tipTexts: string[] = []
    if (insertTempObj instanceof EntityClassInWall) {
      tipTexts = insertTempObj.setPrepareState(x, y, nearest || undefined)
      drawWrapper2DAnd3D()
    } else if (insertTempObj instanceof PointEntityClass) {
      tipTexts = insertTempObj.setPrepareState(x, y)
      drawWrapper2DAnd3D()
    }
    if (tipTexts.length > 0) {
      const canvasAction = canvas2DRef.value!;
      const ctxAction = canvasAction.getContext('2d')!

      const hoverScreenX = x * zoom2DLevel.value + panOffset.value.x
      const hoverScreenY = y * zoom2DLevel.value + panOffset.value.y
      const startY = hoverScreenY + 14;
      // 绘制一个背景矩形
      ctxAction.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctxAction.fillRect(hoverScreenX - 50, startY, 100, 8 + 15 * tipTexts.length);
      ctxAction.font = '14px Arial'
      ctxAction.textBaseline = 'middle'
      ctxAction.strokeStyle = 'white'
      ctxAction.fillStyle = 'white'
      ctxAction.textAlign = 'center'
      tipTexts.forEach((v, index) => {
        ctxAction.fillText(v, hoverScreenX, startY + 15 * index + 13)
      })
    }
  }
}

let matchHandelObj: BaseEntityClass<any> | null = null;
let matchedHandelInfo: HandelInfo | null = null;
let matchHandelStartPoint: Point | null = null;
const handleMouseDown = (e: MouseEvent) => {
  contextMenu.value = null;

  const canvas = canvas2DRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)
  const x = (screenX - panOffset.value.x) / zoom2DLevel.value
  const y = (screenY - panOffset.value.y) / zoom2DLevel.value

  // 只有在拖拽模式下才能拖拽点
  if (currentTool.value === 'drag') {
    if (e.button !== 0) return
    const handleInfoList = getHandleInfoByXY(x, y)
    if (handleInfoList) {
      const { classInfo, handle, startPoint } = handleInfoList
      if (!classInfo.getData().isLocked) {
        matchHandelObj = classInfo
        matchedHandelInfo = handle
        matchHandelStartPoint = { x, y }
        dragOffset.value = { x: 0, y: 0 }
        dragStartPoint.value = {
          x: startPoint.x,
          y: startPoint.y
        }
        const canvasAction = canvas2D2Ref.value!;
        const ctxAction = canvasAction.getContext('2d')!
        ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
        matchHandelObj.draw2DActionHandle(ctxAction, panOffset.value, zoom2DLevel.value)
        return
      }
    }
    // 如果没有拖拽到任何点，开始平移
    isPanningScreen.value = true
    panStartScreenX = screenX
    panStartScreenY = screenY
    return;
  }
}

const handleMouseUp = () => {
  matchHandelObj = null
  matchedHandelInfo = null
  if (isPanningScreen.value) {
    isPanningScreen.value = false
    // 平移过程中，该渲染都渲染过了。鼠标抬起这里不用在重新渲染一下了。2026.6.6
    // drawWrapper2DAnd3D()
  }
}
const handleMouseLeave = () => {
  const canvasAction = canvas2D2Ref.value!;
  const ctxAction = canvasAction.getContext('2d')!
  ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
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
  initUserInfo();
  window.addEventListener('mousemove', handleMouseMoveSplit)
  window.addEventListener('mouseup', handleMouseUpSplit)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMoveSplit)
  window.removeEventListener('mouseup', handleMouseUpSplit)
})

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()

  const canvas = canvas2DRef.value
  if (!canvas) return

  // 绘制操作句柄
  const canvasAction = canvas2D2Ref.value!;
  const ctxAction = canvasAction.getContext('2d')!
  ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)

  const rect = canvas.getBoundingClientRect()
  const screenX = Math.round(e.clientX - rect.left)
  const screenY = Math.round(e.clientY - rect.top)

  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
  const newZoomLevel = Math.max(0.01, Math.min(5, zoom2DLevel.value * zoomFactor))

  const zoomRatio = newZoomLevel / zoom2DLevel.value
  const newPanX = screenX - (screenX - panOffset.value.x) * zoomRatio
  const newPanY = screenY - (screenY - panOffset.value.y) * zoomRatio

  zoom2DLevel.value = newZoomLevel
  panOffset.value = { x: newPanX, y: newPanY }

  drawWrapper2DAnd3D()
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
    console.log('res.data----', res.data.json)
    const initDefaultFile = res.data.json
    initWorldByData(initDefaultFile).finally(() => {
      showDemos.value = false
      demoIniting.value = false
    })
  })
}

// 拖拽上传相关方法
const onDragOver = () => {
  isDragOver.value = true
}

const onDragLeave = (e: DragEvent) => {
  const target = e.currentTarget as HTMLElement
  if (!target.contains(e.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

// 导入外部模型
async function importOutObj2(file: File) {
  importOutObj(file, async (object, file, type, scaleFactor, position) => {
    handleLoadedObject(object, file, type, scaleFactor, position)
  })
}
const onDrop = async (e: DragEvent) => {
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  importOutObj2(file)
}

const handleLoadedObject = async (object: THREE.Group | THREE.Mesh, file: File, type: string, scaleFactor: number, position: THREE.Vector3) => {
  const fileTypeId = `custom_${Date.now()}.${type}`
  console.log('fileTypeId', fileTypeId)
  const customObjItem: ImportFileType = {
    fileTypeId,
    mesh: object,
    file,
  }
  window.worldState.allImportFiles.push(customObjItem)
  const data: ImportFileData = {
    fileTypeId,
    id: Date.now().toString(),
    x: position.x,
    y: position.y,
    z: position.z,
    angleY: 0,
    scale: scaleFactor,
  }
  await worldApi.add('importFile', [data])

  drawWrapper2DAnd3D()
}
function logout() {
  if (confirm('确定要退出登录吗？')) {
    store.dispatch('main/setUserInfo', null)
    localStorage.removeItem('token')
  }
}
function handleObjectHover(object: THREE.Object3D | null) {
  if (object) {
  }
}

function handleObjectClick(object: THREE.Object3D | null) {
  console.log('object', object)
}
function changeObjTypeSelect(type: string, baseObj: BaseEntityClass<any>) {
  activeToolsIndex.value = -1
  insertTempObj = null

  if (allFileKeys.includes(type as any)) {
    insertTempObj = baseObj
    currentTool.value = type
  }
}
function handleLocationPosition(position: { x: number, y: number }) {
  console.log('position', position)
  const canvas = canvas2DRef.value
  if (!canvas) return
  const canvasRect = canvas.getBoundingClientRect()
  const dx = canvasRect.width / 2
  const dy = canvasRect.height / 2
  panOffset.value = {
    x: dx - (position.x * zoom2DLevel.value),
    y: dy - (position.y * zoom2DLevel.value),
  }
  drawWrapper2D()
}
function handleObjChange(baseObj: BaseEntityClass<BaseObjData>) {
  console.log('baseObj', baseObj)
  // 刷新2D和3D场景
  drawWrapper2DAnd3D()
}
async function copyEntity() {
  if (menuEntity) {
    const type = menuEntity.type
    const values = JSON.parse(JSON.stringify(menuEntity.getData()));
    values.id = Date.now().toString()
    const apiList = await worldApi.add(type, [values])
    beCopyEntity = apiList[0]
    if (menuEntity && menuEntiryHandelInfo) {
      if (menuEntity instanceof LineEntityClass) {
        const { points } = (menuEntity as LineEntityClass<Point, LineObjData<Point>>).getData()
        const { index } = menuEntiryHandelInfo
        if (index % 2 === 0) {
          // 拖动的是点
          beCopyEntityHandelInfo = {
            ...menuEntiryHandelInfo,
            x: points[index / 2].x,
            y: points[index / 2].y,
          };
        } else if (index % 2 === 1) {
          beCopyEntityHandelInfo = {
            ...menuEntiryHandelInfo,
            x: points[(index - 1) / 2].x,
            y: points[(index - 1) / 2].y,
          };
        }
      } else if (menuEntity instanceof PointEntityClass) {
        beCopyEntityHandelInfo = {
          ...menuEntiryHandelInfo,
          x: values.x,
          y: values.y,
        };
      }
    }
    contextMenu.value = null
    currentTool.value = 'drag'
    drawWrapper2DAnd3D()
  }
}
function showAiPic() {
  if (canvas3DRef2.value) {
    const imageData = canvas3DRef2.value.getImageData()
    const initialImage = new Image()
    initialImage.src = imageData
    initialImage.onload = () => {
      aiPicInitialImage.value = imageData
      aiPicSize.value = {
        width: initialImage.width,
        height: initialImage.height,
      }
      isShowAiPic.value = true
    }
  }
}

function handlePaySuccess() {
  showPayModal.value = false
  initUserInfo()
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

    &.right {
      .toolbar-item {
        .list {
          left: auto;
          right: 0;
        }
      }
    }
  }

  .userInfo {
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;

    >img {
      height: 18px;
    }
  }

  .userMoney {
    color: #333;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    margin: 0 8px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    box-sizing: border-box;
    display: flex;
    align-items: center;

    >img {
      height: 18px;
      margin-left: 8px;
    }
  }
}

.map2d-container {
  display: flex;
  width: 100vw;
  flex: 1;
  overflow: hidden;
  position: relative;
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
          text-align: center;
          color: #2c3e50;

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
          width: 180px;
          background: white;
          border: 1px solid #d9d9d9;
          box-sizing: border-box;
          border-radius: 8px;
          padding: 7px 0;
          z-index: 1001;

          .childItem {
            border-bottom: 1px solid #f1f1f1;
            margin: 0 8px;

            &:last-child {
              border-bottom: none;
            }

            &:hover {
              background-color: #1890ff;
              color: white;
              font-weight: bold;

              .desc {
                color: white;
              }
            }

            .desc {
              font-size: 14px;
              color: #666;
            }
          }
        }
      }

      .childItem {
        padding: 4px 0;
        cursor: default;
        text-align: center;
        color: #2c3e50;

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
  flex-shrink: 0;
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
  // padding: 8px;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

.drawing-canvas {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
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

  .center-panel-content {
    // padding: 8px;
    width: 100%;
    flex-grow: 1;
    box-sizing: border-box;
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

.right-panel {
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

  .buttons {
    >button {
      margin-left: 4px;
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
  z-index: 1000;

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
      top: 16px;
      right: 16px;
      width: 24px;
      height: 24px;
      padding: 8px;
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
      text-align: center;

      >img {
        width: 100%;
      }
    }
  }
}

.globalLoading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
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

.loadingContent {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;

  .loadingIcon {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
}
</style>
