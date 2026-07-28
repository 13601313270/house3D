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
        </div>
        <div class="canvas-container" :style="{ opacity: isSplitting ? 0 : 1 }">
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
      <DataTypeEditPanel v-if="contextMenu?.visible && editPropTypeKey" :typeKey="editPropTypeKey"
        :editPropConfigInfo="editPropConfigInfo" v-model="editPropInputInfo"
        :initPosition="{ x: contextMenu.x, y: contextMenu.y }" @deleteContextMenuEntity="deleteContextMenuEntity"
        @close="contextMenu = null" @copyEntity="copyEntity" @moveToGroup="moveToGroup"
        @changeGlobalEditGroup="changeGlobalEditGroup" />
      <AllWorldObjSelect v-if="showAllObjSelect" @close="showAllObjSelect = false" />
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
import { ImportFileData } from '@/entities/importFile/index.d';
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
import WorldState from '@/utils/worldState';
import { editItem } from '@/utils/editItem';
import WorldGroup, { EnvironmentConfig } from '@/world/world';
import { PlaneGroupData } from '@/entities/planeGroup/index.d';
import canvas2DSceneManage from '@/utils/canvas2DSceneManage'
import bindDanvas2DSceneDefaultEvent from '@/utils/bindDanvas2DSceneDefaultEvent';
import setHoverPoint from '@/utils/setHoverPoint';

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
const isSplitting = ref(false)
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
initAllPlugin();

const updateCanvasSize = () => {
  const container = document.querySelector('.map2d-container')
  if (!container) return
  canvas2DSceneManage.resize()

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

  // 劫持Ctrl+S保存事件
  window.addEventListener('keydown', handleKeyDown)
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
  const sceneJsonText: string = await t.async('string');
  const sceneData: fileData & {
    importFile: ImportFileType[]
    allImportImgs: string[]
    panOffset: Point
    zoomLevel: number
    cameraState: CameraState
    activeCameraIndex: number
    environmentConfig?: EnvironmentConfig
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

  const type = contextMenu.value.type;
  if (contextMenu.value.index !== undefined) {
    window.globalEditGroup.delete(type, contextMenu.value.index)
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

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMoveSplit)
  window.removeEventListener('mouseup', handleMouseUpSplit)
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
  await window.globalEditGroup.add('importFile', [data])
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
      width: 30px;
      height: 30px;
      margin-right: 8px;
      margin-left: 8px;
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
