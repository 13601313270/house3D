<template>
  <div class="toolbar-item" @mouseleave="leaveObjTypeCate1">
    <div class="addButtonWrapper" v-if="showAddGuide">
      <button class="addButton addButtonGuide" type="button"
        @mouseenter="isMouseInCate1 = true, activeObjTypeId = undefined">
        添加
      </button>
      <div class="guideBubble" @click.stop>
        <div class="guideBubbleDecor guideBubbleDecor1"></div>
        <div class="guideBubbleDecor guideBubbleDecor2"></div>
        <div class="guideBubbleArrow"></div>
        <button class="guideBubbleClose" type="button" @click.stop="dismissAddGuide()" title="关闭引导">×</button>
        <div class="guideBubbleContent">
          <div class="guideBubbleIcon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 16V8L12 3L3 8V16L12 21L21 16Z" stroke="white" stroke-width="1.8" stroke-linejoin="round" />
              <path d="M3.3 8.7L12 14L20.7 8.7" stroke="white" stroke-width="1.8" stroke-linecap="round"
                stroke-linejoin="round" />
              <path d="M12 21V14" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="guideBubbleTextBlock">
            <div class="guideBubbleTitle">添加模型到场景中</div>
            <div class="guideBubbleDesc">点击左侧「添加」按钮，<br />从分类列表中选择一个模型开始创作</div>
          </div>
        </div>
        <div class="guideBubbleFooter">
          <!-- <div class="guideBubbleStep">
            <span class="guideBubbleStepDot active"></span>
            <span class="guideBubbleStepDot"></span>
            <span class="guideBubbleStepDot"></span>
          </div> -->
          <button class="guideBubbleNextBtn" type="button" @click.stop="dismissAddGuide()">
            知道了
            <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
              <path
                d="M7.05 4.05a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L11.69 10 7.05 5.36a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    <button v-else class="addButton" type="button" @mouseenter="isMouseInCate1 = true, activeObjTypeId = undefined">
      添加
    </button>
    <div class="list insertObjTypeSelect" @mouseenter="isMouseInCate1 = true" v-show="isMouseInCate1 || isMouseInCate2">
      <template v-if="lastChooseOutFile">
        <div class="childItem" @click="changeCurrentToolToOutFile(lastChooseOutFile.id), isMouseInCate1 = false"
          @mouseenter="activeObjTypeId = undefined">
          最近使用：{{ lastChooseOutFile.name }}
        </div>
        <div class="splitLine"></div>
      </template>
      <div v-for="groupItem in allFileKeysGroup.filter(item => item.id !== 'other')" :key="groupItem.id"
        class="typeItemContent" :class="{ active: activeObjTypeId === groupItem.id }">
        <div class="typeName" @mouseenter="mouseenterGroup(groupItem.id)">{{ groupItem.name }}</div>
        <div class="childItemList"
          v-if="activeObjTypeId === groupItem.id && groupItem.child && groupItem.child.length > 0">
          <div v-for="item2 in groupItem.child" class="childItem" :key="item2"
            @click="changeCurrentTool(item2), isMouseInCate1 = false">
            <img v-if="allPluginByKey[item2].previewImg" :src="allPluginByKey[item2].previewImg" alt="" class="icon"
              :style="{ width: groupItem.id === 'camera' ? '88px' : '44px' }" />
            <div class="name">{{ allPluginByKey[item2].name }}</div>
          </div>
        </div>
      </div>
      <div class="childItem"
        v-for="value in (allFileKeysGroup.find(item => item.id === 'other') || { child: [] }).child.filter(item => !['outFile', 'outFileInWall', 'importFile'].includes(item))"
        :key="value" :class="{ active: currentTool === value }"
        @click="changeCurrentTool(value), isMouseInCate1 = false" @mouseenter="mouseenterOtherGroup(value)">
        {{ allPluginByKey[value]?.name }}
      </div>
      <div class="splitLine"></div>
      <div>
        <div v-for="item in ObjFileTypes" :key="item.id" class="typeItemContent"
          :class="{ active: activeObjTypeId === item.id }">
          <div class="typeName" @mouseenter="mouseEnterType($event, item)">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
  <teleport to="#teleport">
    <div class="addOutFileChildList" ref="addOutFileChildListRef" @mouseenter="isMouseInCate2 = true"
      @mouseleave="leaveObjTypeCate2"
      :style="{ top: enterEventDomPosition?.y + 'px', left: enterEventDomPosition?.x + 'px' }"
      v-if="activeObjChildList.length > 0 || activePluginChildList.length > 0">
      <div class="childItem help" @click="showHelpModal()">
        <div>
          <div>联系售后添加</div>
          <div class="desc">（24小时内添加）</div>
        </div>
      </div>
      <div v-for="item2 in activePluginChildList" :key="item2.key" class="childItem"
        @click="changeCurrentTool(item2.key), isMouseInCate2 = false">
        <div class="previewImg">
          <img v-if="item2.previewImg" :src="item2.previewImg" alt="" />
        </div>
        <div class="name">{{ item2.name }}</div>
      </div>
      <div v-for="item2 in activeObjChildList" class="childItem" :key="item2.id"
        @click="changeCurrentToolToOutFile(item2.id), isMouseInCate2 = false">
        <div class="previewImg">
          <img v-if="item2.previewImg" :src="item2.previewImg" alt="" />
        </div>
        <div class="name">{{ item2.name }}</div>
      </div>
    </div>
    <div class="defaultValueModal" v-if="showDefaultValueModal" @click.self="showDefaultValueModal = false">
      <div class="modalContent">
        <div class="modalTitle">初始化方案</div>
        <div class="defaultValueList">
          <div v-for="(item, index) in currentDefaultValues" :key="index" class="defaultValueItem"
            @click="createObjWithDefaultValue(currentToolType, item)">
            <img class="img" v-if="item.img" :src="item.img" alt="" />
            <img class="img" v-else src="../assets/Empty.png" alt="" />
            <div class="name">{{ item.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
  <teleport to="#teleport">
    <div v-if="loading" class="loading">
      <img src="../assets/loading_white.svg" alt="loading" />
    </div>
  </teleport>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { ObjOutputFileType } from '@/entities/allObjs';
import { fileDataKeyToClass, allFileKeysGroup, allPluginByKey, allFileWithGroupId } from '@/entities'
import axios from 'axios';
import { OutFileInWallData } from '@/entities/outFileInWall/index.d'
import { OutFileInWallEntity } from '@/entities/outFileInWall/entity';
import { OutFileEntity } from '@/entities/outFile/entity';
import { OutFileData } from '@/entities/outFile/index.d'
import { BaseEntityClass } from '@/types/baseEntity';
import PluginType, { DefaultItem } from '@/entities/pluginType';
import { BaseObjData } from '@/types/map2d';

defineProps<{
  currentTool: string | 'drag'
}>()
const emits = defineEmits<{
  (e: 'select', value: string, baseObj: BaseEntityClass<any>): void,
  (e: 'showHelpModal'): void,
}>()
const lastChooseOutFile = ref<ObjOutputFileType>()
const isMouseInCate1 = ref(false)
const isMouseInCate2 = ref(false)
const enterEventDomPosition = ref<{ x: number, y: number }>()
const addOutFileChildListRef = ref<HTMLDivElement>()
type ObjFileType = {
  id: number,
  name: string,
  child: {
    id: string,
    name: string,
    type: number,
    previewImg?: string,
  }[]
}
const ObjFileTypes = ref<Array<ObjFileType>>([])
const activePluginChildList = ref<Array<PluginType>>([])
const activeObjTypeId = ref<number | string>()
const activeObjChildList = ref<Array<{
  id: string,
  name: string,
  type: number,
  previewImg?: string
}>>([])

const showDefaultValueModal = ref(false)
const currentDefaultValues = ref<DefaultItem<any>[]>([])
const currentToolType = ref('')
const loading = ref(false)

// ===== 添加引导相关 =====
const GUIDE_STORAGE_KEY = 'house3d_add_obj_guide_completed'
const showAddGuide = ref(false)

// 用户点击气泡的「知道了」/关闭按钮：仅本次隐藏，下次仍会出现
function dismissAddGuide() {
  showAddGuide.value = false
  localStorage.setItem(GUIDE_STORAGE_KEY, '1')
}

// 用户真正创建了对象：写入 localStorage，以后不再展示引导
function markGuideCompleted() {
  try {
    localStorage.setItem(GUIDE_STORAGE_KEY, '1')
  } catch (e) {
    // localStorage 不可用时忽略
  }
  showAddGuide.value = false
}

// ========================

async function changeCurrentTool(type: string) {
  const ClassName = fileDataKeyToClass[type];
  let defaultValue: DefaultItem<BaseObjData>[] | Promise<DefaultItem<BaseObjData>[]> = allPluginByKey[type].defaultValues()
  if (defaultValue instanceof Promise) {
    loading.value = true
    defaultValue = await defaultValue
  }
  loading.value = false

  if (!ClassName) return

  if (defaultValue.length > 1) {
    currentDefaultValues.value = defaultValue
    currentToolType.value = type
    showDefaultValueModal.value = true
  } else if (defaultValue.length === 1) {
    createObjWithDefaultValue(type, defaultValue[0])
  }
}

function createObjWithDefaultValue(type: string, defaultItem: DefaultItem<any>) {
  const ClassName = fileDataKeyToClass[type]
  if (ClassName) {
    const insertTempObj = new ClassName(window.globalEditGroup, defaultItem.data)
    if (insertTempObj) {
      insertTempObj.init()
      insertTempObj.reBuildBoundingBoxData()
    }
    emits('select', type, insertTempObj)
    // 对象创建成功，标记引导完成
    markGuideCompleted()
  }
  showDefaultValueModal.value = false
}

onMounted(async () => {
  try {
    const completed = localStorage.getItem(GUIDE_STORAGE_KEY)
    if (!completed) {
      showAddGuide.value = true
    }
  } catch (e) {
    // localStorage 不可用时跳过引导
  }
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
  ObjFileTypes.value = data;
})
async function changeCurrentToolToOutFile(id: string) {
  activeObjChildList.value = []
  activePluginChildList.value = []
  const index = window.worldState.ObjFileTypes.findIndex(item => item.id === id);
  if (index === -1) {
    const { data } = await axios.get('https://api.studying1v1.com/video/objectFileById/' + id)
    const res: ObjOutputFileType = data;
    lastChooseOutFile.value = res;
    window.worldState.ObjFileTypes.push(res)
  } else {
    lastChooseOutFile.value = window.worldState.ObjFileTypes[index];
  }
  const findObjInfo = window.worldState.ObjFileTypes.find(item => item.id === id);
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
      canAngelZ: findObjInfo.canAngelZ,
    }
    const insertTempObj = new OutFileInWallEntity(window.globalEditGroup, data)
    insertTempObj.init()
    insertTempObj.reBuildBoundingBoxData()
    emits('select', 'outFileInWall', insertTempObj)
    markGuideCompleted()
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
      canAngelZ: findObjInfo.canAngelZ,
    }
    const insertTempObj = new OutFileEntity(window.globalEditGroup, data)
    insertTempObj.init()
    insertTempObj.reBuildBoundingBoxData()
    emits('select', 'outFile', insertTempObj)
    markGuideCompleted()
  }
}

async function mouseEnterType(event: MouseEvent, type: ObjFileType) {
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
  activeObjTypeId.value = type.id
  activeObjChildList.value = type.child

  const allFileInThisType = allFileWithGroupId[type.id]
  activePluginChildList.value = allFileInThisType;

  const dom = event.target as HTMLElement;
  const { right, top } = dom.getBoundingClientRect()
  enterEventDomPosition.value = { x: right, y: top }
  nextTick(() => {
    if (addOutFileChildListRef.value) {
      const { bottom } = addOutFileChildListRef.value!.getBoundingClientRect()
      // console.log('addOutFileChildListRef', bottom, window.innerHeight)
      if (bottom > window.innerHeight) {
        enterEventDomPosition.value = {
          x: right,
          y: top - (bottom - window.innerHeight) - 4
        }
      }
    }
  })
}

function leaveObjTypeCate1() {
  isMouseInCate1.value = false
  // activeObjTypeId.value = undefined

  setTimeout(() => {
    if (isMouseInCate2.value) {
      return
    } else {
      activeObjChildList.value = []
      activePluginChildList.value = []
    }
  }, 10)
}

function leaveObjTypeCate2() {
  isMouseInCate2.value = false
  activeObjChildList.value = []
  activePluginChildList.value = []
}

function mouseenterGroup(groupName: string) {
  // console.log(111, groupName);
  activeObjTypeId.value = groupName;
  activeObjChildList.value = []
  activePluginChildList.value = []
}
function mouseenterOtherGroup(groupName: string) {
  activeObjTypeId.value = groupName
  activeObjChildList.value = []
  activePluginChildList.value = []
}

function showHelpModal() {
  isMouseInCate2.value = false;
  emits('showHelpModal')
}
</script>
<style lang="less" scoped>
.toolbar-item {
  position: relative;
}

.addButton {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: #e4e6eb;
  cursor: pointer;
  font-size: 16px;
  min-width: 50px;
  transition: all 0.3s;
}

.insertObjTypeSelect {
  position: absolute;
  background: white;
  top: 100%;
  width: 160px;
  left: 0;
  // background: white;
  border: 1px solid #d9d9d9;
  box-sizing: border-box;
  border-radius: 8px;
  padding: 8px 0;
  z-index: 1000;
  max-height: 80vh;

  >.childItem {
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

.typeItemContent {
  position: relative;

  // &:hover {
  //   .typeName {
  //     background-color: #1890ff;
  //     color: white;
  //     font-weight: bold;
  //     position: relative;

  //     &::after {
  //       color: white;
  //     }
  //   }

  //   .childItemList {
  //     display: block;
  //   }
  // }

  &.active {
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
    top: -8px;
    left: 100%;
    min-width: 120px;
    background: white;
    border: 1px solid #d9d9d9;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 7px 0;
    z-index: 1001;

    .childItem {
      border-bottom: 1px solid #f1f1f1;
      padding: 4px 12px;
      text-align: center;
      margin: 0 8px;
      display: flex;
      align-items: center;
      justify-content: flex-start;

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

      >img {
        width: 44px;
        margin: 0 4px;
        flex-shrink: 0;
      }

      .name {
        flex-grow: 1;
        text-align: center;
        text-wrap: nowrap;
      }

      .desc {
        font-size: 14px;
        color: #666;
      }
    }
  }
}

.addOutFileChildList {
  position: fixed;
  top: -8px;
  left: 100%;
  max-height: 90vh;
  overflow-y: auto;
  width: 180px;
  background: white;
  border: 1px solid #d9d9d9;
  box-sizing: border-box;
  border-radius: 8px;
  padding: 7px 0;
  z-index: 1001;
  padding: 8px;
  gap: 8px;
  width: auto;
  // max-height: 8;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;

  .childItem {
    background: white;
    border: solid 1px #eaeaea;
    border-radius: 4px;
    padding: 4px 0;
    cursor: default;
    color: #2c3e50;
    padding: 4px 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    height: 113px;

    &:hover {
      background-color: #1890ff;
      color: white;
      font-weight: bold;

      .desc {
        color: white;
      }
    }

    &.help {
      font-size: 12px;

      .desc {
        font-size: 12px;
      }
    }

    .previewImg {
      width: 83px;
      height: 83px;
      margin-left: 8px;
      margin-right: 8px;
      background-color: white;

      >img {
        width: 100%;
        height: 100%;
      }
    }

    .name {
      font-size: 14px;
      color: #2c3e50;
      padding-right: 8px;
    }

    .desc {
      font-size: 14px;
      color: #666;
    }
  }
}

.defaultValueModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;

  .modalContent {
    background: white;
    border-radius: 8px;
    padding: 16px;
    min-width: 280px;
    max-width: 80vw;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    .modalTitle {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 16px;
      color: #2c3e50;
    }

    .defaultValueList {
      display: flex;
      flex-direction: row;
      gap: 8px;
      flex-wrap: wrap;

      .defaultValueItem {
        width: 142px;
        height: 142px;
        box-sizing: border-box;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
        border: solid 1px #eaeaea;
        color: #2c3e50;
        transition: background-color 0.2s;

        .img {
          width: 100px;
          height: 100px;
          border: solid 1px #eaeaea;
          border-radius: 4px;
          margin-bottom: 4px;
          object-fit: contain;
          // background-color: white;
        }

        .name {
          font-size: 14px;
          color: #666;
        }

        &:hover {
          background-color: #1890ff;
          color: white;

          .name {
            color: white;
          }
        }
      }
    }
  }
}

.loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;

  >img {
    width: 32px;
    height: 32px;
    animation: loading 2s linear infinite;
  }

  @keyframes loading {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
}

/* ===== 添加引导样式 ===== */
.addButtonWrapper {
  position: relative;
  display: inline-block;
}

.addButtonGuide {
  animation: guidePulse 1.6s ease-in-out infinite;
  background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%);
  color: white;
  font-weight: bold;
  box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.6);
  position: relative;
  z-index: 1;
}

@keyframes guidePulse {
  0% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.6);
    transform: scale(1);
  }

  50% {
    box-shadow: 0 0 0 10px rgba(24, 144, 255, 0);
    transform: scale(1.05);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(24, 144, 255, 0);
    transform: scale(1);
  }
}

/* ========== 复杂精美气泡 ========== */
.guideBubble {
  top: 45px;
  left: 110px;
  height: 122px;
  position: absolute;
  bottom: calc(100% + 20px);
  transform: translateX(-50%);
  width: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  padding: 18px 18px 14px 18px;
  z-index: 999;
  cursor: default;
  overflow: hidden;
  box-shadow:
    0 20px 50px -10px rgba(102, 126, 234, 0.5),
    0 10px 30px -5px rgba(118, 75, 162, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  animation: guideBubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    guideBubbleFloat 3s ease-in-out infinite 0.5s;
}

/* 装饰圆形光晕 */
.guideBubbleDecor {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.guideBubbleDecor1 {
  width: 140px;
  height: 140px;
  right: -50px;
  top: -60px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, transparent 70%);
  animation: guideDecorFloat 6s ease-in-out infinite;
}

.guideBubbleDecor2 {
  width: 80px;
  height: 80px;
  left: -20px;
  bottom: -30px;
  background: radial-gradient(circle, rgba(135, 206, 250, 0.25) 0%, transparent 70%);
  animation: guideDecorFloat 5s ease-in-out infinite reverse;
}

@keyframes guideDecorFloat {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.8;
  }

  50% {
    transform: translate(6px, -6px) scale(1.08);
    opacity: 1;
  }
}

/* 气泡箭头 */
.guideBubbleArrow {
  position: absolute;
  left: 50%;
  bottom: -14px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 14px solid transparent;
  border-top-color: #764ba2;
  filter: drop-shadow(0 4px 6px rgba(118, 75, 162, 0.35));
}

/* 关闭按钮 */
.guideBubbleClose {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: white;
  border-radius: 50%;
  font-size: 16px;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.2s;
  z-index: 2;
}

.guideBubbleClose:hover {
  background: rgba(255, 255, 255, 0.32);
  transform: rotate(90deg);
}

/* 内容区：图标 + 文字 */
.guideBubbleContent {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.guideBubbleIcon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  backdrop-filter: blur(4px);
}

.guideBubbleTextBlock {
  flex: 1;
  min-width: 0;
}

.guideBubbleTitle {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 6px;
  letter-spacing: 0.2px;
  background: linear-gradient(180deg, #ffffff 0%, #e4e8ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.guideBubbleDesc {
  font-size: 12.5px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 400;
}

/* 底部：步骤点 + 知道了按钮 */
.guideBubbleFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  position: relative;
  z-index: 1;
}

.guideBubbleStep {
  display: flex;
  align-items: center;
  gap: 6px;
}

.guideBubbleStepDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.guideBubbleStepDot.active {
  width: 18px;
  border-radius: 3px;
  background: linear-gradient(90deg, #ffd86b 0%, #ff9a9e 100%);
  box-shadow: 0 0 8px rgba(255, 216, 107, 0.5);
}

.guideBubbleNextBtn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: white;
  color: #667eea;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.guideBubbleNextBtn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.guideBubbleNextBtn:active {
  transform: translateY(0);
}

@keyframes guideBubbleIn {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(16px) scale(0.85);
  }

  60% {
    transform: translateX(-50%) translateY(-4px) scale(1.02);
  }

  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes guideBubbleFloat {

  0%,
  100% {
    transform: translateX(-50%) translateY(0);
    filter: drop-shadow(0 10px 20px rgba(102, 126, 234, 0.35));
  }

  50% {
    transform: translateX(-50%) translateY(-5px);
    filter: drop-shadow(0 16px 28px rgba(102, 126, 234, 0.45));
  }
}

/* ======================== */
</style>