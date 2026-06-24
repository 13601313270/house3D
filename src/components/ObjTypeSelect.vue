<template>
  <div class="toolbar-item" @mouseleave="leaveObjTypeCate1">
    <button class="addButton" type="button" @mouseenter="isMouseInCate1 = true">
      添加
    </button>
    <div class="list insertObjTypeSelect" @mouseenter="isMouseInCate1 = true" v-show="isMouseInCate1 || isMouseInCate2">
      <template v-if="lastChooseOutFile">
        <div class="childItem" @click="changeCurrentToolToOutFile(lastChooseOutFile.id), isMouseInCate1 = false">
          最近使用：{{ lastChooseOutFile.name }}
        </div>
        <div class="splitLine"></div>
      </template>
      <div v-for="item in allFileKeysGroup.filter(item => item.id !== 'other')" :key="item.id" class="typeItemContent"
        @mouseenter="clearCate1List">
        <div class="typeName">{{ item.name }}</div>
        <div class="childItemList" v-if="item.child && item.child.length > 0">
          <div v-for="item2 in item.child" class="childItem" :key="item2"
            @click="changeCurrentTool(item2), isMouseInCate1 = false">
            {{ allFileKeysName[item2] }}
          </div>
        </div>
      </div>
      <div class="childItem"
        v-for="value in (allFileKeysGroup.find(item => item.id === 'other') || { child: [] }).child.filter(item => item !== 'outFile' && item !== 'outFileInWall' && item !== 'importFile')"
        :key="value" :class="{ active: currentTool === value }"
        @click="changeCurrentTool(value), isMouseInCate1 = false" @mouseenter="clearCate1List">
        {{ allFileKeysName[value] }}
      </div>
      <div class="splitLine"></div>
      <div>
        <div v-for="item in ObjFileTypes" :key="item.id" class="typeItemContent">
          <div class="typeName" @mouseenter="mouseEnterType($event, item)">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </div>
  <teleport to="#teleport">
    <div class="addOutFileChildList" ref="addOutFileChildListRef" @mouseenter="isMouseInCate2 = true"
      @mouseleave="leaveObjTypeCate2"
      :style="{ top: enterEventDomPosition?.y + 'px', left: enterEventDomPosition?.x + 'px' }"
      v-if="activeObjChildList.length > 0">
      <div v-for="item2 in activeObjChildList" class="childItem" :key="item2.id"
        @click="changeCurrentToolToOutFile(item2.id), isMouseInCate2 = false">
        <div class="previewImg">
          <img v-if="item2.previewImg" :src="item2.previewImg" alt="" />
        </div>
        <div class="name">{{ item2.name }}</div>
      </div>
      <div class="childItem" @click="showHelpModal, isMouseInCate2 = false">
        <div>
          <div>联系售后添加</div>
          <div class="desc">（24小时内添加）</div>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { ObjOutputFileType } from '@/entities/allObjs';
import { allFileKeysName, fileDataKeyToClass, allFileKeysGroup, allPluginByKey } from '@/entities'
import axios from 'axios';
import { OutFileInWallData } from '@/entities/outFileInWall/index.d'
import { OutFileInWallDataClass } from '@/entities/outFileInWall/dataClass';
import { OutFileInWallEntity } from '@/entities/outFileInWall/entity';
import { OutFileDataClass } from '@/entities/outFile/dataClass';
import { OutFileEntity } from '@/entities/outFile/entity';
import { OutFileData } from '@/entities/outFile/index.d'
import { BaseEntityClass } from '@/types/baseEntity';

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
const activeObjChildList = ref<Array<{ id: string, name: string, type: number, previewImg?: string }>>([])

const worldApi = window.worldApi
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

function changeCurrentTool(type: string) {
  const ClassName = fileDataKeyToClass[type];
  const defaultValue = allPluginByKey[type].defaultValues()
  if (ClassName) {
    const insertTempObj = new ClassName(worldApi, defaultValue[0])
    if (insertTempObj) {
      insertTempObj.init()
    }
    emits('select', type, insertTempObj)
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
  activeObjChildList.value = type.child
  const dom = event.target as HTMLElement;
  const { right, top } = dom.getBoundingClientRect()
  enterEventDomPosition.value = { x: right, y: top }
  nextTick(() => {
    if (addOutFileChildListRef.value) {
      const { bottom } = addOutFileChildListRef.value!.getBoundingClientRect()
      console.log('addOutFileChildListRef', bottom, window.innerHeight)
      if (bottom > window.innerHeight) {
        enterEventDomPosition.value = {
          x: right,
          y: top - (bottom - window.innerHeight)
        }
      }
    }
  })
}

function leaveObjTypeCate1() {
  isMouseInCate1.value = false
  setTimeout(() => {
    if (isMouseInCate2.value) {
      return
    } else {
      activeObjChildList.value = []
    }
  }, 10)
}

function leaveObjTypeCate2() {
  isMouseInCate2.value = false
  activeObjChildList.value = []
}

function clearCate1List() {
  activeObjChildList.value = []
}

function showHelpModal() {
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
      padding: 4px 0;
      text-align: center;
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

  .childItem {
    background: white;
    border-bottom: 1px solid #f1f1f1;
    margin: 0 8px;
    padding: 4px 0;
    cursor: default;
    color: #2c3e50;
    padding: 4px 0;
    text-align: center;
    display: flex;
    flex-direction: row;
    align-items: center;

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

    .previewImg {
      width: 40px;
      height: 40px;
      border: solid 1px #eaeaea;
      border-radius: 4px;
      margin-left: 4px;
      margin-right: 8px;
      background-color: white;

      >img {
        width: 100%;
        height: 100%;
      }
    }

    .desc {
      font-size: 14px;
      color: #666;
    }
  }
}
</style>