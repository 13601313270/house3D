<template>
  <div class="allWOrldObjSelect" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <div class="configContainer">
      <div class="head">
        <div class="moveIcon" @mousedown="startDrag">
          <img src="../assets/move2.svg" alt="move" @mousedown.prevent />
        </div>
        <div class="title">对象列表({{ allObjCount }})</div>
        <div class="closeIcon" @click="emit('close')">
          <img src="../assets/closeWhite.svg" alt="close" />
        </div>
      </div>
      <div class="configItemList">
        <div class="configItem" v-for="item in allObjList" :key="item.id" @mouseenter="handleEnter(item)">
          <div class="nameInfo">
            <span>{{ item.name }}</span><span class="tip" v-if="item.tip">({{ item.tip }})</span>
          </div>
          <div class="tools">
            <div v-if="item.isLocked" class="toolItem" @click="handleUnLock(item, false)">
              <img class="img lock" src="@/assets/lock.svg" alt="lock" />
            </div>
            <div v-else class="toolItem" @click="handleUnLock(item, true)">
              <img class="img" src="@/assets/unLock.svg" alt="unLock" />
            </div>
            <div class="toolItem" @click="handleLocation(item)">
              <img class="img" src="@/assets/location.svg" alt="location" />
            </div>
            <!-- <div class="toolItem" @click="openEditPanel(item.id)">
              <img class="img" src="@/assets/edit.svg" alt="edit" />
            </div> -->
            <!-- <div class="toolItem">
              <img v-if="item.isHidden" class="img" src="@/assets/notVisible.svg" alt="notVisible" />
              <img v-else class="img" src="@/assets/visible.svg" alt="visible" />
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import message from '@/utils/message'
import { PointEntityClass } from '@/types/pointEntity'
import { LineEntityClass } from '@/types/lineEntity'
import { BaseEntityClass } from '@/types/baseEntity'
import { BaseObjData } from '@/types/map2d'
const allObjCount = ref(0)
type Item = {
  id: string,
  name: string,
  type: string,
  isHidden: boolean,
  isLocked: boolean,
  tip?: string,
}
const allObjList = ref<Array<Item>>([])
const props = defineProps<{
  zoom2DLevel: number,
  panOffset: { x: number, y: number },
}>()
onMounted(() => {
  reloadObjList();
})
function reloadObjList() {
  let newCount = 0;
  allObjList.value = []
  for (const key in window.worldApi.allFileMapObjects) {
    if (window.worldApi.allFileMapObjects[key]) {
      newCount += window.worldApi.allFileMapObjects[key].length
      allObjList.value.push(...window.worldApi.allFileMapObjects[key].map((item) => {
        const { id, isLocked, isHidden, tip } = item.getData()
        return {
          id,
          name: item.name,
          type: item.type,
          isHidden: isHidden || false,
          isLocked: isLocked || false,
          tip,
        }
      }))
    }
  }
  allObjCount.value = newCount
}
const position = ref<{ x: number, y: number }>({ x: window.innerWidth / 3, y: 100 })

const emit = defineEmits<{
  (e: 'close'): void,
  (e: 'locationPosition', value: { x: number, y: number }): void,
  (e: 'onChange', value: BaseEntityClass<BaseObjData>): void,
}>()

let isDragging = false
let offsetX = 0
let offsetY = 0
const EDGE_PADDING = 6
function startDrag(e: MouseEvent) {
  isDragging = true
  const contextMenuEl = document.querySelector('.allWOrldObjSelect') as HTMLElement
  if (contextMenuEl) {
    const parentEl = contextMenuEl.parentElement
    if (parentEl) {
      const parentRect = parentEl.getBoundingClientRect()
      // const contextMenuRect = contextMenuEl.getBoundingClientRect()
      const mouseXInParent = e.clientX - parentRect.left
      const mouseYInParent = e.clientY - parentRect.top
      offsetX = mouseXInParent - position.value.x
      offsetY = mouseYInParent - position.value.y
    }
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
function onMouseMove(e: MouseEvent) {
  if (!isDragging) return

  const contextMenuEl = document.querySelector('.allWOrldObjSelect') as HTMLElement
  if (!contextMenuEl) return

  const parentEl = contextMenuEl.parentElement
  if (!parentEl) return

  const parentRect = parentEl.getBoundingClientRect()
  const contextMenuRect = contextMenuEl.getBoundingClientRect()

  const mouseXInParent = e.clientX - parentRect.left
  const mouseYInParent = e.clientY - parentRect.top

  const newLeft = mouseXInParent - offsetX
  const newTop = mouseYInParent - offsetY

  const panelWidth = contextMenuRect.width
  const panelHeight = contextMenuRect.height

  const maxLeft = parentRect.width - panelWidth - EDGE_PADDING
  const maxTop = parentRect.height - panelHeight - EDGE_PADDING

  const clampedLeft = Math.max(EDGE_PADDING, Math.min(newLeft, maxLeft))
  const clampedTop = Math.max(EDGE_PADDING, Math.min(newTop, maxTop))

  position.value = { x: clampedLeft, y: clampedTop }
}

function onMouseUp() {
  isDragging = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

function handleEnter(item: {
  id: string,
  name: string,
  type: string,
  isLocked: boolean,
}) {
  const thisTypeObjList = window.worldApi.allFileMapObjects[item.type]
  if (!thisTypeObjList) return
  const thisObj = thisTypeObjList.find(v => {
    return v.getData().id === item.id
  })
  if (thisObj) {
    const canvasAction = document.getElementById('canvas2D2') as HTMLCanvasElement;
    const ctxAction = canvasAction.getContext('2d')!
    ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
    thisObj.draw2D(ctxAction, props.panOffset, props.zoom2DLevel)
  }
}
// function openEditPanel(id: string) {
//   alert(id)
// }
function handleUnLock(item: Item, isLocked: boolean) {
  const { id, type } = item
  const group = window.worldApi.allFileMapObjects[type]
  if (!group) return
  const api = group.find(v => v.getData().id === id)
  if (!api) return
  console.log(api)
  api.setData({
    ...api.getData(),
    isLocked,
  })
  item.isLocked = isLocked
  message.success('解锁成功', { position: 'top-center' })
  emit('onChange', api)
}
function handleLocation(item: Item) {
  const { id, type } = item
  const group = window.worldApi.allFileMapObjects[type]
  if (!group) return
  const api = group.find(v => v.getData().id === id)
  if (!api) return
  if (api instanceof PointEntityClass) {
    const { x, y } = api.getData()
    emit('locationPosition', { x, y })
    nextTick(() => {
      handleEnter(item)
    })
  } else if (api instanceof LineEntityClass) {
    console.log('api', api)
    const points = api.getData().points
    console.log('pointspoints', points)
  }
}

window.worldApi.onWorldChange(() => {
  reloadObjList()
})
</script>
<style scoped lang="less">
.allWOrldObjSelect {
  position: absolute;
  background: white;
  box-sizing: border-box;
  border-radius: 8px;
  box-shadow: 0 0 14px 3px rgba(0, 0, 0, 0.65);
  z-index: 1000;
  max-height: 85vh;
  overflow: hidden;
  display: flex;

  .configContainer {
    width: 340px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    flex-grow: 1;

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: black;
      color: white;

      .moveIcon {
        width: 32px;
        height: 32px;
        cursor: move;
        display: flex;
        align-items: center;
        justify-content: center;

        >img {
          width: 24px;
          height: 24px;
        }
      }

      .title {
        font-size: 16px;
        line-height: 32px;
        height: 32px;
        text-align: center;
        flex-grow: 1;
      }

      .closeIcon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;

        >img {
          height: 24px;
          width: 100%;
        }
      }
    }

    .configItemList {
      padding: 0 12px;
      overflow-y: auto;
      flex-grow: 1;

      .configItem {
        display: flex;
        align-items: center;
        border-bottom: solid 1px #e9e9e9;
        padding: 4px 0;

        &:last-child {
          border-bottom: none;
        }

        .nameInfo {
          flex-grow: 1;

          .tip {
            color: #8a8a8a;
          }
        }

        .tools {
          display: flex;
          align-items: center;

          .toolItem {
            // border: 1px solid #8a8a8a;
            // border-radius: 4px;
            padding: 1px;
            // margin-left: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            box-sizing: border-box;

            .img {
              width: 24px;
              height: 24px;

              &.lock {
                width: 20px;
                height: 20px;
                margin-top: -2px;
              }
            }
          }
        }
      }
    }
  }
}
</style>