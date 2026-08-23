<template>
  <div class="map2d-app">
    <div class="headTools">
      <div class="toolbar">
        <img class="icon" src="/favicon256white.png" />
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
      <div class="editMode">
        <div>
          <div class="timeLineTitle">
            <button :class="{ active: editMode === 'scene' }" @click="setEditMode('scene')">
              场景编辑
            </button>
            <button :class="{ active: editMode === 'animation' }" @click="setEditMode('animation')">
              动画编辑
            </button>
          </div>
        </div>
      </div>
      <div style="flex-grow: 1;"></div>
      <div class="toolbar right">
        <div class="toolbar-item" @mouseleave="activeToolsIndex = -1">
          <div v-if="store.state.main.userInfo">
            <div class="userInfo" @mouseenter="activeToolsIndex = 2">
              <span>欢迎登录：{{ store.state.main.userInfo.email }}</span>
              <span v-if="isVip" class="vipBadgeTop">VIP</span>
              <span>（</span>
              <img src="money.png" />
              <span>{{ store.state.main.userInfo.money }}金币）</span>
            </div>
            <div class="list user" v-show="activeToolsIndex === 2">
              <div class="userMoney">
                <div class="userMoneyInner">
                  <span>当前金币：{{ store.state.main.userInfo.money }}</span>
                  <img src="money.png" />
                </div>
              </div>
              <div class="userVip" v-if="isVip">
                <div class="userVipInner">
                  <div class="vipCrown">👑</div>
                  <div class="vipInfo">
                    <div class="vipTitle">尊贵VIP会员</div>
                    <div class="vipSubtitle">到期：{{ formattedVipEndDate }}（剩{{ vipRemainingDays }}天）</div>
                  </div>
                </div>
              </div>
              <div class="addGroupAddMoney" v-if="!store.state.main.userInfo.getJoinGroupMoney"
                @click="showGroupQrModal = true">
                <img src="money.png" />
                <div class="text">添加微信群，获得<span class="price">20</span>金币</div>
              </div>
              <div @click="showPayModal = true" class="childItem">
                购买金币
              </div>
              <div class="childItem" @click="showVipModal = true">
                购买专业版权益
              </div>
              <div @click="logout" class="childItem">
                退出
              </div>
            </div>
          </div>
          <button v-else type="button" class="login-btn" @click="showLoginDialog">
            登录
          </button>
        </div>
      </div>
    </div>
    <div class="map2d-container" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop">
      <div class="left-panel" :style="{ width: panel1SplitWidthPer * 100 + '%' }">
        <div class="toolbar">
          <div style="flex-shrink: 0;">布局图</div>
          <ObjTypeSelect :currentTool="currentTool" @select="changeObjTypeSelect" @showHelpModal="showHelpModal = true"
            v-if="editMode === 'scene'" />
          <button @click="triggerImportFile" type="button" v-if="editMode === 'scene'">
            导入模型
          </button>
          <button @click="showAllObjSelect = true" type="button" v-if="editMode === 'scene'">
            对象列表({{ allObjCount }})
          </button>
          <input type="file" id="fileInput" ref="loadProgramFileInputRef" accept=".devt" style="display: none"
            @change="handleLoadProgramFileChange" />
        </div>
        <div class="canvas-container" :style="{ opacity: (isSplitting || isSplitTimeLine) ? 0 : 1 }">
          <canvas ref="canvas2DRef" class="drawing-canvas" />
          <canvas ref="canvas2DActionRef" class="drawing-canvas" />
          <!-- <img v-if="isPaningAngel && isPaningAngelMoved" class="protractor" src="protractor.png"
            :style="{ left: panningScreenCenter.x + 'px', top: panningScreenCenter.y + 'px' }" /> -->
          <div class="showGroupExit" v-if="showGroupExit">
            <div class="showGroupExitButton" @click="groupExit">退出组编辑</div>
          </div>
        </div>
      </div>

      <div class="split-bar" @mousedown.prevent="startSplit(1)"></div>

      <div class="right-panel" :style="{ width: panel2SplitWidthPer * 100 + '%' }">
        <div class="tools">
          <div style="flex-shrink: 0;">全景图</div>
          <div style="flex-grow: 1;"></div>
          <div class="buttons">
            <button @click="showEnvironmentEditor = true" type="button" v-if="editMode === 'scene'">
              环境
            </button>
          </div>
        </div>
        <!-- {{ insertTempDoor }} -->
        <div class="center-panel-content">
          <Canvas3D ref="canvas3DRefCenter" v-model:cameraState="cameraStateCenter" :camera="centerPanelCamera"
            :aspectRatio="aspectRatio2" :showCamera="true" cameraType="perspective" />
        </div>
      </div>

      <div class="split-bar" @mousedown.prevent="startSplit(2)"></div>
      <div class="right-panel" :style="{ width: (1 - panel1SplitWidthPer - panel2SplitWidthPer) * 100 + '%' }">
        <div class="tools">
          <div style="flex-shrink: 0;">摄像机：</div>
          <div class="cameraList">
            <div v-for="(item, index) in allCamera" @click="changeCamera2(index)"
              :class="{ active: activeCameraIndex === index }" class="cameraItem">{{ index + 1 }}
            </div>
          </div>
          <div class="buttons" v-if="allCamera.length && cameraRightState">
            <button type="button" @click="showAiPic">AI渲染</button>
            <button type="button" @click="exportImage">导出图片</button>
          </div>
        </div>
        <div class="right-panel-content">
          <Canvas3D v-if="allCamera.length && cameraRightState && rightPanelCamera" ref="canvas3DRef2"
            :camera="rightPanelCamera" :cameraState="cameraRightState"
            :aspectRatio="cameraRightState.aspectW / cameraRightState.aspectH" :showCamera="false"
            cameraType="perspective" />
          <div v-else class="noCamera">请至少在场景中添加一个摄像机</div>
        </div>
      </div>
    </div>

    <div v-if="editMode === 'animation'" class="timeLine" :style="{ height: timeHeight + 'px' }">
      <div class="split-bar-x" @mousedown.prevent="startSplitTimeLine()"></div>
      <TimeLine :isVip="isVip" @showBuyVip="showVipModal = true" />
    </div>
    <DataTypeEditPanel v-if="contextMenu?.visible && editPropTypeKey" :typeKey="editPropTypeKey"
      :editPropConfigInfo="editPropConfigInfo" v-model="editPropInputInfo"
      :initPosition="{ x: contextMenu.x, y: contextMenu.y }" @deleteContextMenuEntity="deleteContextMenuEntity"
      @close="contextMenu = null" @copyEntity="copyEntity" @moveToGroup="moveToGroup"
      @changeGlobalEditGroup="changeGlobalEditGroup" @addAnimation="handleAddAnimation" />
    <AllWorldObjSelect v-if="showAllObjSelect" @close="showAllObjSelect = false" />
    <EnvironmentEditor v-if="showEnvironmentEditor" @close="showEnvironmentEditor = false" />
  </div>
  <div v-if="showDemos" class="allDemosContent">
    <div class="allDemosContentInner">
      <div class="title"><img class="icon" src="/favicon256.png" />欢迎来到<span class="p">「摄影棚」</span>，请选择创建场景的模板</div>
      <div class="closeBtn" @click="showDemos = false">
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
  <ShowGroupQrModal v-if="showGroupQrModal" @close="showGroupQrModal = false" />
  <ShowVipModal v-if="showVipModal" @close="showVipModal = false" @paySuccess="handleVipPaySuccess" />
  <ImportModelConfirm v-model:visible="showImportModelConfirm" :object="pendingImportData.object"
    :file="pendingImportData.file" :type="pendingImportData.type" :scale-factor="pendingImportData.scaleFactor"
    :position="pendingImportData.position" @confirm="handleImportModelConfirm" />
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import axios from 'axios'
import * as THREE from 'three'
import JSZip from 'jszip';
import request from '@/utils/request'
import { Point } from '../types'
import { PlaneGroupEntity } from '../entities/planeGroup/entity'
import Canvas3D from '../components/Canvas3D.vue'
import { CameraState } from '@/types/camera'
import { allFileKeys } from '@/entities'
import initAllPlugin from '@/entities/initAllPlugin'
import { PointEntityClass } from '@/types/pointEntity'
import { BaseObjData, HandelInfo, LineObjData } from '@/types/map2d'
import { CameraData } from '@/entities/camera/index.d'
import { ImportFileType, ObjOutputFileType } from '@/entities/allObjs'
import ObjTypeSelect from '@/components/ObjTypeSelect.vue'
import EnvironmentEditor from '@/components/EnvironmentEditor.vue'
import Login from '@/components/Login.vue'
import { useStore } from 'vuex';
import { Store } from '@/store';
import Help from '@/components/help.vue'
import processUploadedFile from '@/utils/processUploadedFile';
import DataTypeEditPanel from './DataTypeEditPanel.vue'
import { BaseEntityClass } from '@/types/baseEntity';
import { LineEntityClass } from '@/types/lineEntity';
import AllWorldObjSelect from '@/components/AllWorldObjSelect.vue'
import message from '@/utils/message';
import importOutObj from '@/utils/importOutObj';
import { CameraBase } from '@/types/CameraBase';
import { sleep } from '@/utils/sleep';
import saveWorld, { fileData } from '@/utils/saveWorld';
import AiPic from '@/components/aiPic.vue'
import ShowPayModal from '@/components/showPayModal.vue'
import ShowGroupQrModal from '@/components/showGroupQrModal.vue'
import ShowVipModal from '@/components/showVipModal.vue'
import WorldState from '@/utils/worldState';
import { editItem } from '@/utils/editItem';
import WorldGroup, { EnvironmentConfig } from '@/world/world';
import { PlaneGroupData } from '@/entities/planeGroup/index.d';
import canvas2DSceneManage from '@/utils/canvas2DSceneManage'
import bindDanvas2DSceneDefaultEvent from '@/utils/bindDanvas2DSceneDefaultEvent';
import setHoverPoint from '@/utils/setHoverPoint';
import TimeLine from '@/components/timeLine.vue'
import { TimelineData, timelineState } from '@/utils/timelineManage';
import generateClipId from '@/utils/generateClipId';
import ImportModelConfirm from '@/components/ImportModelConfirm.vue';
import handleLoadedObject from '@/utils/handleLoadedObject';
// @ts-ignore
import initDefaultData from '@/utils/initDefaultData.json'

const canvas2DRef = ref<HTMLCanvasElement | null>(null)
const canvas2DActionRef = ref<HTMLCanvasElement | null>(null)
const canvas3DRefCenter = ref<typeof Canvas3D | null>(null)
const canvas3DRef2 = ref<typeof Canvas3D | null>(null)
const activeToolsIndex = ref(-1)
const currentTool = ref<string | 'drag'>('drag')
const lastPoint = ref<Point | null>(null)
const isMenuing = ref(false);
const panel1SplitWidthPer = ref(0.35)
const panel2SplitWidthPer = ref(0.35)
const maxTimeHeight = 400;
const timeHeight = ref(200)
const isSplitting = ref(false)
const isSplitTimeLine = ref(false)
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
const insertAdding = ref(false)

const centerPanelCamera = ref(new THREE.PerspectiveCamera(55, aspectRatio2.value, 0.1, 20000));
const rightPanelCamera = ref<THREE.PerspectiveCamera | THREE.OrthographicCamera>();

const showPayModal = ref(false)
const showGroupQrModal = ref(false)
const showVipModal = ref(false)

// 模型导入确认弹窗
const showImportModelConfirm = ref(false)
const pendingImportData = ref<{
  object: THREE.Group | THREE.Mesh | null
  file: File | null
  type: string
  scaleFactor: number
  position: THREE.Vector3
}>({
  object: null,
  file: null,
  type: '',
  scaleFactor: 1,
  position: new THREE.Vector3(),
})

const isVip = computed(() => {
  if (!store.state.main.userInfo) {
    return false;
  }
  const vipEndDate = store.state.main.userInfo.vipEndDate
  if (!vipEndDate) return false
  return new Date(vipEndDate).getTime() > Date.now()
})

const formattedVipEndDate = computed(() => {
  const vipEndDate = store.state.main.userInfo.vipEndDate
  if (!vipEndDate) return ''
  const d = new Date(vipEndDate)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const vipRemainingDays = computed(() => {
  const vipEndDate = store.state.main.userInfo.vipEndDate
  if (!vipEndDate) return 0
  const diff = new Date(vipEndDate).getTime() - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const editMode = ref<'scene' | 'animation'>('scene')

function setEditMode(mode: 'scene' | 'animation') {
  editMode.value = mode
  timelineState.isPlaying = mode === 'animation';
  if (mode === 'scene') {
    console.log('timelineState.timelineData', timelineState.timelineData)
    // 把所有有动画状态的对象恢复到默认编辑态数据
    timelineState.timelineData.clips.forEach(v => {
      const entity = window.worldApi.children.find(vv => {
        return vv.getOriginalData().id === v.entityId
      })
      if (!entity) return;
      entity.setAnimationData({})
    })
  }
  nextTick(() => {
    updateCanvasSize()
  })
}

initAllPlugin();

const updateCanvasSize = () => {
  const container = document.querySelector('.map2d-container')
  if (!container) return
  canvas2DSceneManage.resize()

  const centerPanelContainer = document.querySelector('.center-panel-content')
  if (centerPanelContainer) {
    const canvasRect = centerPanelContainer.getBoundingClientRect()
    const width = Math.floor(canvasRect.width)
    const height = Math.floor(canvasRect.height)

    if (width > 0 && height > 0) {
      aspectRatio2.value = width / height
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
  canvas2DSceneManage.renderPreview()
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

const worldState = new WorldState()
window.worldState = worldState

const worldApi = new WorldGroup(null, {
  id: 'world',
  childrenData: [
  ],
  x: 0,
  y: 0,
  z: 0,
  angleY: 0,
  name: '世界',
  temp: false,
})
window.worldApi = worldApi
const showGroupExit = ref<boolean>(false)
window.globalEditGroup = worldApi

allObjCount.value = worldApi.getAllObjectCount()

const activeCameraIndex = ref(0)
async function changeCamera2(activeIndex: number = 0) {
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
      canvas2DSceneManage.renderPreview()
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

// @ts-ignore
window.get3DCanvas = () => {
  // console.log(canvas3DRef2.value)
  // // @ts-ignore
  // window.fff = canvas3DRef2;
  if (canvas3DRef2.value) {
    return canvas3DRef2.value.getCanvas()
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
            const typeList = worldApi.getTypeListEntity(type)
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
      changeCamera2(activeCameraIndex.value)
    }
  })
  const canvasContainer = document.querySelector('.canvas-container')!
  // (0,0)位移到中央
  const canvasRect = canvasContainer.getBoundingClientRect()
  const dx = canvasRect.width / 2
  const dy = canvasRect.height / 2
  const scene2D = canvas2DSceneManage.addScene(
    [
      canvas2DRef.value!,
      canvas2DActionRef.value!,
    ],
    canvasRect.width,
    canvasRect.height,
    1,
    {
      x: dx,
      y: dy,
    }
  );
  bindDanvas2DSceneDefaultEvent(scene2D)
  scene2D.onClick(() => {
    contextMenu.value = null
  })
  scene2D.onMouseDown((point) => {
    contextMenu.value = null;
    if (window.globalEditGroup.insertTempObj) return;
    isMenuing.value = point.button === 2
  })
  scene2D.onMouseUp((point) => {
    if (isMenuing.value) {
      handleContextMenu(point)
      canvas2DSceneManage.list[0].isPaningAngel = false
      canvas2DSceneManage.list[0].isPanningScreen = false
      return;
    }
    canvas2DSceneManage.list[0].matchHandelObj = null
    canvas2DSceneManage.list[0].matchedHandelInfo = null
    canvas2DSceneManage.list[0].isPanningScreen = false
  })
  scene2D.onInsertAdding((value) => {
    insertAdding.value = value
  })

  canvas2DSceneManage.renderPreview()
  nextTick(() => {
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
  window.addEventListener('resize', () => updateCanvasSize())
  updateCanvasSize()

  const handleKeyDown = async (event: KeyboardEvent) => {
    // 检测 Ctrl+S (Windows/Linux) 或 Command+S (Mac)
    const tempPointInsertData = canvas2DSceneManage.list[0].tempPointInsertData;
    if ((event.ctrlKey || event.metaKey)) {
      if (event.key === 's') {
        event.preventDefault(); // 阻止浏览器保存网页
        saveDrawing();
      } else if (event.key === 'z') {
        console.log('撤销一步')
        if (window.globalEditGroup.insertTempObj && window.globalEditGroup.insertTempObj instanceof LineEntityClass) {
          const data = window.globalEditGroup.insertTempObj.getData()
          if (tempPointInsertData.length === 1) {
            window.globalEditGroup.insertTempObj.beforeRemove()
            window.globalEditGroup.insertTempObj = null;
            canvas2DSceneManage.list[0].tempPointInsertData = []
            lastPoint.value = null
            setHoverPoint(null)
            message.info('退出绘制')
          } else {
            // tempPointInsertData去掉最后一项
            tempPointInsertData.pop()
            data.points = tempPointInsertData;
            window.globalEditGroup.insertTempObj.setData(data)
            canvas2DSceneManage.renderPreview()
          }
        }
      }
    } else if (event.key === 'Escape') {
      if (window.globalEditGroup.insertTempObj) {
        if (window.globalEditGroup.insertTempObj instanceof LineEntityClass) {
          insertAdding.value = true
          window.globalEditGroup.insertTempObj.setPreparePoint(tempPointInsertData)
          const insertData = window.globalEditGroup.insertTempObj.getData()
          if (tempPointInsertData.length >= 2) {
            await window.globalEditGroup.add(currentTool.value, [insertData])
          }
          window.globalEditGroup.insertTempObj.beforeRemove()
          window.globalEditGroup.insertTempObj = null;
          canvas2DSceneManage.renderPreview()
          canvas2DSceneManage.list[0].tempPointInsertData = []
          lastPoint.value = null
          setHoverPoint(null)
          setTimeout(() => {
            insertAdding.value = false
          }, 300)// 至少停留300毫秒，防止出现那种闪现的效果。
        } else {
          window.globalEditGroup.insertTempObj.beforeRemove()
          window.globalEditGroup.insertTempObj = null;
          canvas2DSceneManage.renderPreview()
        }
      } else if (window.globalEditGroup !== worldApi) {
        groupExit()
      }
      currentTool.value = 'drag'
    }
  }

  initUserInfo();
  window.addEventListener('mousemove', handleMouseMoveSplit)
  window.addEventListener('mouseup', handleMouseUpSplit)
  window.addEventListener('mousemove', handleMouseMoveTimeLine)
  window.addEventListener('mouseup', handleMouseUpTimeLine)

  // 劫持Ctrl+S保存事件
  window.addEventListener('keydown', handleKeyDown)

  // 初始默认数据
  console.log('initDefaultData', initDefaultData)
  await initWorldByData(initDefaultData)

  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

const loadProgramFileInputRef = ref<HTMLInputElement | null>(null)

const triggerImportFile = () => {
  const inputDom = document.createElement('input')
  inputDom.type = 'file'
  inputDom.accept = '.fbx,.obj,.glb'
  inputDom.style.display = 'none'
  document.body.appendChild(inputDom)
  function change(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      importOutObj2(file)
    }
    // 销毁 input 元素
    inputDom.remove()
    inputDom.removeEventListener('change', change)
  }
  inputDom.addEventListener('change', change)
  inputDom.click()
}

const saveDrawing = async () => {
  if (!store.state.main.userInfo) {
    alert('请先登录')
    showLogin.value = true
    return
  }
  activeToolsIndex.value = -1
  await saveWorld(
    canvas2DSceneManage.list[0].panOffset,
    canvas2DSceneManage.list[0].level,
    cameraStateCenter.value,
    activeCameraIndex.value,
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
  const sceneJsonText: string = await t.async('string');
  const sceneData: fileData & {
    importFile: ImportFileType[]
    allImportImgs: string[]
    panOffset: Point
    zoomLevel: number
    cameraState: CameraState
    activeCameraIndex: number
    environmentConfig?: EnvironmentConfig
    timelineData?: TimelineData
  } = JSON.parse(sceneJsonText);

  const allFileTypeId: Set<string> = new Set();

  if (sceneData.importFile && sceneData.importFile.length) {
    for (const v of sceneData.importFile) {
      allFileTypeId.add(v.fileTypeId);
    }
  }
  if (sceneData.planeGroup && sceneData.planeGroup.length) {
    (sceneData.planeGroup as PlaneGroupData[]).forEach((planeGroupItem: PlaneGroupData) => {
      if (planeGroupItem.childrenData) {
        planeGroupItem.childrenData.forEach((childItem) => {
          if (childItem.type === 'importFile') {
            // @ts-ignore
            allFileTypeId.add(childItem.value.fileTypeId);
          }
        })
      }
    })
  }
  const fileTypes = Array.from(allFileTypeId)
  for (let i = 0; i < fileTypes.length; i++) {
    const fileTypeId = fileTypes[i]
    const read = await zip.file(`assets/${fileTypeId}`);
    if (!read) continue
    const blob = await read.async('blob');
    const file = new File([blob], fileTypeId, { type: blob.type || 'application/octet-stream' })

    await processUploadedFile(file, (object: THREE.Group, file: File) => {
      const customObjItem: ImportFileType = {
        fileTypeId,
        mesh: object,
        file,
      }
      window.worldState.allImportFiles.push(customObjItem)
    })
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
    initWorldLoading.value = true
    await initWorldByData(sceneData)
    initWorldLoading.value = false

    // 还原动画数据
    if (sceneData.timelineData && sceneData.timelineData.clips.length > 0) {
      // timelineData____.value = sceneData.timelineData as any
      timelineState.timelineData = sceneData.timelineData as any
    } else {
      // timelineData____.value = { duration: 30, clips: [] }
      timelineState.timelineData = { duration: 30, clips: [] }
    }
  } catch (error) {
    initWorldLoading.value = false
    console.error(error)
  }
  input.value = ''
}

// 辅助函数：获取所有实体的 entityId -> [typeKey, index] 映射
function getAllEntitiesMap(): Map<string, [string, number]> {
  const map = new Map<string, [string, number]>()
  for (const typeKey of allFileKeys) {
    const entityList = worldApi.getTypeListEntity(typeKey)
    if (entityList) {
      for (let i = 0; i < entityList.length; i++) {
        const entity = entityList[i]
        const entityId = entity.getData()?.id
        if (entityId) {
          map.set(entityId, [typeKey, i])
        }
      }
    }
  }
  return map
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
  if (data.planeGroup) {
    (data.planeGroup as PlaneGroupData[]).forEach((planeGroupItem: PlaneGroupData) => {
      if (planeGroupItem.childrenData) {
        console.log('planeGroupItem.childrenData', planeGroupItem.childrenData)
        planeGroupItem.childrenData.forEach(child => {
          if (child.type === 'outFile') {
            // @ts-ignore
            allFileTypeId.add(child.value.fileTypeId)
          }
        })
      }
    })
  }
  if (data.outFileInWall) {
    data.outFileInWall.forEach(v => {
      // @ts-ignore
      allFileTypeId.add(v.fileTypeId)
    })
  }

  const fileTypes = Array.from(allFileTypeId)

  if (fileTypes.length > 0) {
    const { data: res } = await axios.post('https://api.studying1v1.com/video/objectFileByIds', {
      ids: fileTypes
    })
    res.forEach((v: ObjOutputFileType) => {
      window.worldState.ObjFileTypes.push(v)
    })
  }

  console.log('allFileKeys', data, allFileKeys)

  for (let i = 0; i < allFileKeys.length; i++) {
    const key = allFileKeys[i]
    if (data[key] && data[key].length > 0) {
      await worldApi.add(key, data[key])
    }
  }

  canvas2DSceneManage.list[0].setPanOffset({
    x: data.panOffset.x || 0,
    y: data.panOffset.y || 0,
  })
  canvas2DSceneManage.list[0].setLevel(data.zoomLevel || 1)
  if (data.cameraState) {
    cameraStateCenter.value = data.cameraState
  }
  if (data.activeCameraIndex !== undefined) {
    await changeCamera2(data.activeCameraIndex)
  }
  if (data.environmentConfig) {
    worldApi.setEnvironMent(data.environmentConfig)
  }
}

const handleContextMenu = (point: {
  e: MouseEvent,
  x: number,
  y: number,
}) => {
  const canvas = canvas2DSceneManage.list[0].canvasList[0]
  if (!canvas) return

  const screenX = point.x
  const screenY = point.y
  const { angleY } = worldApi.getData();
  const dx = screenX - canvas2DSceneManage.list[0].panOffset.x
  const dy = screenY - canvas2DSceneManage.list[0].panOffset.y
  const cos = Math.cos(angleY * -1)
  const sin = Math.sin(angleY * -1)
  const xInWorld = (dx * cos + dy * sin) / canvas2DSceneManage.list[0].level
  const yInWorld = (-dx * sin + dy * cos) / canvas2DSceneManage.list[0].level
  let xInGroup = xInWorld;
  let yInGroup = yInWorld;
  // 先平移，再旋转，再缩放
  if (window.globalEditGroup !== worldApi) {
    const { x: groupX, y: groupY, angleY: groupAngle } = window.globalEditGroup.getData()
    const dx2 = xInWorld - groupX
    const dy2 = yInWorld - groupY
    const cosGroup = Math.cos(groupAngle * -1)
    const sinGroup = Math.sin(groupAngle * -1)
    xInGroup = dx2 * cosGroup + dy2 * sinGroup
    yInGroup = -dx2 * sinGroup + dy2 * cosGroup
  }

  editPropConfigInfo.value = []
  editPropInputInfo.value = {}
  editPropTypeIndex.value = -1
  const sortAllFileKeys = ([...allFileKeys]).reverse();

  for (let i = 0; i < sortAllFileKeys.length; i++) {
    const type = sortAllFileKeys[i]
    if (sortAllFileKeys.includes(type)) {
      if (!window.globalEditGroup.getTypeListEntity(type)) {
        continue
      }
      for (let j = 0; j < window.globalEditGroup.getTypeObjectsData(type).length; j++) {
        const api: BaseEntityClass<any> = window.globalEditGroup.getTypeListEntity(type)[j]
        const snapPoint = api.matchHandelInfo(xInGroup, yInGroup)
        if (snapPoint) {
          menuEntity = api
          menuEntiryHandelInfo = snapPoint;
          const data = api.getData()
          if (data.isLocked) {
            message.warning('锁定对象不能编辑，请去[对象列表]解锁', { position: 'top-center' })
            continue
          }
          api.editPropConfig(snapPoint, (propConfig, callback) => {
            const data = api.getData()
            console.log('dist', propConfig)
            const contextMenuX = point.e.clientX
            const contextMenuY = point.e.clientY
            editSnapPoint.value = snapPoint
            editPropTypeKey.value = type
            editPropTypeIndex.value = j
            const modifyConfig: editItem[] = [...propConfig];
            modifyConfig.push({
              id: 'isHidden',
              label: '是否暂时隐藏3D模型',
              dataType: 'boolean',
              value: data.isHidden || false,
            })
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
                value: data.tip || '',
              })
              modifyConfig.push({
                id: 'tipFontSize',
                label: '提示信息字号',
                dataType: 'number',
                min: 1,
                max: 120,
                step: 1,
                value: data.tipFontSize || 96,
              })
            }
            if (timelineState.isPlaying) {
              editPropConfigInfo.value = modifyConfig.filter(v => {
                return v.dataType === 'number' || api.canEditAnimationDataColumn().includes(v.id);
              })
            } else {
              editPropConfigInfo.value = modifyConfig
            }
            const inputData: any = {}
            modifyConfig.forEach(v => {
              if (v.dataType !== 'title') {
                inputData[v.id] = v.value
              }
            })
            inputData.isLocked = data.isLocked || false
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
              window.editPropEntity = api;
              editPropConfigEditCallback = (val: any) => {
                const changeData: any = {};
                const data = api.getData();// 这个一定不要用上面的data，而是每次都要重新getData。
                Object.keys(val).forEach(key => {
                  if (!['isHidden', 'isLocked'].includes(key) && typeof val[key] !== 'function') {
                    if (JSON.stringify(val[key]) !== JSON.stringify(data[key])) {
                      changeData[key] = val[key];
                    }
                  }
                })

                callback(changeData)
              }
              nextTick(() => {
                const height = document.querySelector('.context-menu')?.clientHeight
                if (height && contextMenu.value) {
                  if (point.e.clientY + height > window.outerHeight) {
                    contextMenu.value.y = window.outerHeight - height - 5
                  }
                }
              })
            })
          }, () => {
            contextMenu.value = null
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

  const type = contextMenu.value.type
  if (contextMenu.value.index !== undefined) {
    // 获取实体的 entityId
    const entityList = worldApi.getTypeListEntity(type)
    const entity = entityList?.[contextMenu.value.index]
    const entityId = entity?.getData()?.id

    // 删除实体
    window.globalEditGroup.delete(type, contextMenu.value.index)

    // 从 timelineData 中移除对应的动画数据
    if (entityId) {
      // timelineData____.value.clips = timelineData____.value.clips.filter(
      //   clip => clip.entityId !== entityId
      // )
      // timelineData____.value = { ...timelineData____.value }

      timelineState.timelineData = {
        ...timelineState.timelineData,
        clips: timelineState.timelineData.clips.filter(
          clip => clip.entityId !== entityId
        )
      }
    }
  }
  contextMenu.value = null
}

const clearDrawing = () => {
  if (confirm('确定要清空所有绘制内容吗？')) {
    worldApi.clearAll();
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

const startSplitTimeLine = () => {
  isSplitTimeLine.value = true
  document.body.style.cursor = 'row-resize'
}
const handleMouseMoveTimeLine = (e: MouseEvent) => {
  if (!isSplitTimeLine.value) return
  const containerHeight = window.innerHeight
  // console.log('ddddd', containerHeight, e.clientY)
  const minHeight = 20;
  const mousePositionPer = Math.min(Math.max(containerHeight - e.clientY, minHeight), maxTimeHeight)
  timeHeight.value = mousePositionPer
}
const handleMouseUpTimeLine = () => {
  if (isSplitTimeLine.value) {
    isSplitTimeLine.value = false
    document.body.style.cursor = 'default'
    updateCanvasSize()
  }
}

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMoveSplit)
  window.removeEventListener('mouseup', handleMouseUpSplit)
  window.removeEventListener('mousemove', handleMouseMoveTimeLine)
  window.removeEventListener('mouseup', handleMouseUpTimeLine)
})

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

    worldApi.clearAll();
    activeToolsIndex.value = -1

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
    // 保存待导入数据，显示二次确认弹窗
    pendingImportData.value = {
      object,
      file,
      type,
      scaleFactor,
      position,
    }
    showImportModelConfirm.value = true
  })
}

// 模型导入确认
const handleImportModelConfirm = () => {
  const { object, file, type, scaleFactor, position } = pendingImportData.value
  if (object && file) {
    handleLoadedObject(object, file, type, scaleFactor, position)
  }
}

const onDrop = async (e: DragEvent) => {
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const file = files[0]
  importOutObj2(file)
}

function logout() {
  if (confirm('确定要退出登录吗？')) {
    store.dispatch('main/setUserInfo', null)
    localStorage.removeItem('token')
  }
}

function changeObjTypeSelect(type: string, baseObj: BaseEntityClass<any>) {
  activeToolsIndex.value = -1
  if (window.globalEditGroup.insertTempObj) {
    window.globalEditGroup.insertTempObj.beforeRemove()
    window.globalEditGroup.insertTempObj = null
  }
  if (allFileKeys.includes(type as any)) {
    window.globalEditGroup.insertTempObj = baseObj
    currentTool.value = type
  }
}

async function copyEntity() {
  if (menuEntity) {
    const type = menuEntity.type
    const values = JSON.parse(JSON.stringify(menuEntity.getData()));
    values.id = Date.now().toString()
    const apiList = await window.globalEditGroup.add(type, [values])
    canvas2DSceneManage.list[0].beCopyEntity = apiList[0]
    if (menuEntity && menuEntiryHandelInfo) {
      if (menuEntity instanceof LineEntityClass) {
        const { points } = (menuEntity as LineEntityClass<Point, LineObjData<Point>>).getData()
        const { index } = menuEntiryHandelInfo
        if (index % 2 === 0) {
          // 拖动的是点
          canvas2DSceneManage.list[0].beCopyEntityHandelInfo = {
            ...menuEntiryHandelInfo,
            x: points[index / 2].x,
            y: points[index / 2].y,
          };
        } else if (index % 2 === 1) {
          canvas2DSceneManage.list[0].beCopyEntityHandelInfo = {
            ...menuEntiryHandelInfo,
            x: points[(index - 1) / 2].x,
            y: points[(index - 1) / 2].y,
          };
        }
      } else if (menuEntity instanceof PointEntityClass) {
        canvas2DSceneManage.list[0].beCopyEntityHandelInfo = {
          ...menuEntiryHandelInfo,
          x: values.x,
          y: values.y,
        };
      }
    }
    contextMenu.value = null
    currentTool.value = 'drag'
  }
}
async function moveToGroup(id: string) {
  if (!contextMenu.value) return
  if (!menuEntity) return
  const group: PlaneGroupEntity = worldApi.getTypeListEntity('planeGroup').find((entity) => entity.getData().id === id) as PlaneGroupEntity;
  console.log('group', group)

  const type = menuEntity.type
  const values = JSON.parse(JSON.stringify(menuEntity.getData()));
  const boundingBoxData = menuEntity.boundingBoxData
  const groupData = group.getData()
  values.id = Date.now().toString()
  values.x = values.x - groupData.x
  values.y = values.y - groupData.y
  values.z = values.z - groupData.z
  if (boundingBoxData) {
    if (values.x - boundingBoxData[0].x / 2 < groupData.width / -2) {
      values.x = groupData.width / -2 + boundingBoxData[0].x / 2
    } else if (values.x + boundingBoxData[0].x / 2 > groupData.width / 2) {
      values.x = groupData.width / 2 - boundingBoxData[0].x / 2
    }
    if (values.y - boundingBoxData[0].z / 2 < groupData.height / -2) {
      values.y = groupData.height / -2 + boundingBoxData[0].z / 2;
    } else if (values.y + boundingBoxData[0].z / 2 > groupData.height / 2) {
      values.y = groupData.height / 2 - boundingBoxData[0].z / 2
    }
  }
  await group.add(type, [values])
  menuEntity.beforeRemove()
  window.globalEditGroup.delete(type, contextMenu.value.index)
  contextMenu.value = null
}
function changeGlobalEditGroup() {
  if (menuEntity instanceof PlaneGroupEntity) {
    window.globalEditGroup = menuEntity
    showGroupExit.value = true;
    if (window.globalEditGroup instanceof PlaneGroupEntity) {
      window.globalEditGroup.isSetGlobalEditingGroup = true
      canvas2DSceneManage.renderPreview()
    }
  }
  contextMenu.value = null
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

function handleVipPaySuccess() {
  showVipModal.value = false
  initUserInfo()
}

function groupExit() {
  // 关闭悬浮的箭头
  const allBoundingBox = window.globalEditGroup.boundingBoxList()
  allBoundingBox.forEach((item) => {
    item.visible = false
  })
  const allMoveZBox = window.globalEditGroup.moveZBoxList()
  allMoveZBox.forEach((item) => {
    // @ts-ignore
    const entity = item.children[0].entity as BaseEntityClass<any>
    if (entity instanceof PointEntityClass) {
      entity.moveZBox.visible = false
    }
  })
  if (window.globalEditGroup instanceof PlaneGroupEntity) {
    window.globalEditGroup.isSetGlobalEditingGroup = false
  }
  window.globalEditGroup = worldApi
  showGroupExit.value = false;
  canvas2DSceneManage.renderPreview()
  if (window.globalEditGroup.insertTempObj) {
    window.globalEditGroup.insertTempObj.beforeRemove()
    window.globalEditGroup.insertTempObj = null
  }
}

function handleAddAnimation(data: { typeKey: string; modelValue: Record<string, any> }) {
  const { typeKey } = data

  const entityList = worldApi.getTypeListEntity(typeKey)
  if (!entityList || !contextMenu.value) return

  const entityIndex = contextMenu.value.index
  const entity = entityList[entityIndex]
  if (!entity || entity.meshList.length === 0) return

  const entityData = entity.getData()
  const entityId = entityData.id

  const clipCount = timelineState.timelineData.clips.length
  const startTime = clipCount * 3
  const endTime = startTime + 10

  const newClip = {
    clipId: generateClipId(),
    entityId,
    startTime,
    endTime,
    columns: []
  }

  // timelineData____.value.clips.push(newClip)
  // timelineData____.value = { ...timelineData____.value }
  const clips = [...timelineState.timelineData.clips];
  clips.push(newClip)
  timelineState.timelineData = {
    ...timelineState.timelineData,
    clips,
  }
  // timelineState.timelineData.clips.push(newClip);
  contextMenu.value = null
}
function showLoginDialog() {
  showLogin.value = true
}
window.showLoginDialog = showLoginDialog;
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
  background: #0B0D0F;
  padding-right: 8px;

  .toolbar {
    display: flex;
    padding: 0;
    width: auto;
    background-color: transparent;

    .icon {
      width: 30px;
      height: 30px;
      margin-right: 8px;
      margin-left: 8px;
    }

    .toolbar-item {

      button {
        padding: 4px 8px;
        border: none;
        color: #F7F7F5;
        border-radius: 4px;
        background: transparent;
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

    .vipBadgeTop {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 4px;
      padding: 1px 6px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 3px;
      background: linear-gradient(135deg, #ffd66b 0%, #d4a74a 100%);
      color: #5c3d00;
      box-shadow: 0 1px 3px rgba(212, 167, 74, 0.4);
      letter-spacing: 0.5px;
    }
  }

  .userMoney {
    padding: 4px 8px;
    border-radius: 4px;
    margin: 0 8px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    box-sizing: border-box;

    .userMoneyInner {
      color: #333;
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: bold;

      >img {
        height: 18px;
        margin-left: 8px;
      }
    }
  }

  .userVip {
    padding: 4px 8px;
    border-radius: 4px;
    margin: 0 8px 8px;
    box-sizing: border-box;
    background: linear-gradient(135deg, #fff8e6 0%, #ffecc0 100%);
    border: 1px solid #f0d88a;
    border-radius: 6px;

    .userVipInner {
      display: flex;
      align-items: center;
      gap: 10px;

      .vipCrown {
        font-size: 24px;
        flex-shrink: 0;
      }

      .vipInfo {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .vipTitle {
          font-size: 14px;
          font-weight: bold;
          background: linear-gradient(135deg, #e6c06b 0%, #d4a74a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .vipSubtitle {
          font-size: 12px;
          color: #996600;
        }
      }
    }
  }

  .addGroupAddMoney {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 8px 8px;
    color: #181818;
    font-size: 14px;
    border-radius: 4px;
    padding: 8px 8px;
    cursor: pointer;
    border: solid 1px #eff6e3;
    background-color: #f2f7ea;

    >img {
      height: 48px;
    }

    .text {
      margin-top: 4px;
      font-size: 14px;

      .price {
        font-size: 18px;
        font-weight: bold;
        color: #44a23b;
      }
    }

    &:hover {
      background-color: #f0f0f0;
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

// .timeLine {
//   // background-color: blue;
// }

.toolbar {
  display: flex;
  padding: 4px 8px;
  align-items: center;
  background: #F7F7F5;
  gap: 8px;
  height: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;

  button {
    color: #17181A;
  }

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

      &.user {
        width: 240px;
      }

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
          background-color: #635bff;
          color: white;
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

  .protractor {
    position: absolute;
    pointer-events: none;
    width: 50%;
    z-index: 1000;
    transform: translate(-50%, -50%);
  }

  .showGroupExit {
    position: absolute;
    top: 0;
    right: 0;
    padding: 8px;
    background-color: white;

    .showGroupExitButton {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      background: #e4e6eb;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s;
      flex-shrink: 0;

      &:hover {
        background: #d9d9d9;
      }
    }
  }
}

.drawing-canvas {
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
    background-color: #F7F7F5;
    height: 40px;
  }

  .center-panel-content {
    // padding: 8px;
    width: 100%;
    flex-grow: 1;
    overflow: hidden;
    box-sizing: border-box;
  }

  .right-panel-content {
    padding: 8px;
    width: 100%;
    flex-grow: 1;
    overflow: hidden;
    box-sizing: border-box;
  }
}

.split-bar {
  width: 4px;
  background: #0B0D0F;
  cursor: col-resize;
  transition: background 0.2s;
  z-index: 100;

  &:hover {
    background: #1890ff;
  }
}

.editMode {
  padding: 6px 12px;
  margin-left: 48px;

  .timeLineTitle {
    display: flex;
    background: #e4e6eb;
    border-radius: 12px;
    padding: 4px;

    button {
      padding: 2px 12px;
      border: none;
      border-radius: 10px;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
      flex-shrink: 0;
      margin-right: 0;
      color: #8a8f99;

      &:not(:last-child) {
        margin-right: 4px;
      }

      &.active {
        background: #fff;
        color: #1a1a1a;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
    }
  }
}

.timeLine {
  .split-bar-x {
    height: 4px;
    background: #141b44;
    cursor: row-resize;
    transition: background 0.2s;
    z-index: 100;

    &:hover {
      background: #1890ff;
    }
  }
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
    display: flex;

    >button {
      margin-left: 4px;
      color: #17181A;
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
    background-color: #F7F7F5;
    padding: 16px;
    box-sizing: border-box;
    position: relative;

    .title {
      font-size: 22px;
      line-height: 40px;
      color: #17181A;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
        width: 54px;
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
      height: 223px;
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
