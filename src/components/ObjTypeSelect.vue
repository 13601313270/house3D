<template>
  <div class="toolbar-item" @mouseleave="leaveObjTypeCate1">
    <button class="addButton" type="button" @mouseenter="isMouseInCate1 = true, activeObjTypeId = undefined">
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
        v-for="value in (allFileKeysGroup.find(item => item.id === 'other') || { child: [] }).child.filter(item => item !== 'outFile' && item !== 'outFileInWall' && item !== 'importFile')"
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
import { allFileKeysName, fileDataKeyToClass, allFileKeysGroup, allPluginByKey, allFileWithGroupId } from '@/entities'
import axios from 'axios';
import { OutFileInWallData } from '@/entities/outFileInWall/index.d'
import { OutFileInWallDataClass } from '@/entities/outFileInWall/dataClass';
import { OutFileInWallEntity } from '@/entities/outFileInWall/entity';
import { OutFileDataClass } from '@/entities/outFile/dataClass';
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

const worldApi = window.worldApi

const showDefaultValueModal = ref(false)
const currentDefaultValues = ref<DefaultItem<any>[]>([])
const currentToolType = ref('')
const loading = ref(false)

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
    const insertTempObj = new ClassName(worldApi, defaultItem.data)
    if (insertTempObj) {
      insertTempObj.init()
    }
    emits('select', type, insertTempObj)
  }
  showDefaultValueModal.value = false
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
  ObjFileTypes.value = data;
})
async function changeCurrentToolToOutFile(id: string) {
  activeObjChildList.value = []
  activePluginChildList.value = []
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
      canAngelZ: findObjInfo.canAngelZ,
    }
    const insertTempObjData = new OutFileInWallDataClass(data)
    const insertTempObj = new OutFileInWallEntity(worldApi, insertTempObjData)
    insertTempObj.init()
    emits('select', 'outFileInWall', insertTempObj)
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
    const insertTempObjData = new OutFileDataClass(data)
    const insertTempObj = new OutFileEntity(worldApi, insertTempObjData)
    insertTempObj.init()
    emits('select', 'outFile', insertTempObj)
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
  width: 50px;
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
</style>