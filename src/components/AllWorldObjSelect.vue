<template>
  <div class="allWOrldObjSelect" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <div class="configContainer">
      <div class="head" @mousedown="startDrag">
        <div class="moveIcon">
          <img src="../assets/move2.svg" alt="move" @mousedown.prevent />
        </div>
        <div class="title">对象列表({{ allObjCount }})</div>
        <div class="closeIcon" @mousedown.stop @click="emit('close')">
          <img @mousedown.prevent.stop src="../assets/closeWhite.svg" alt="close" />
        </div>
      </div>
      <div class="configItemList">
        <div class="configItem" v-for="item in allObjList" :key="item.id" @mouseenter="handleEnter(item)">
          <div class="info">
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
          <div v-if="item.children" class="children">
            <div v-for="child in item.children" :key="child.id" class="childItem">
              {{ child.name }}
            </div>
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
import canvas2DSceneManage from '@/utils/canvas2DSceneManage'
import { GroupBaseEntity } from '@/types/groupBase/entity'

const allObjCount = ref(0)
type Item = {
  id: string,
  name: string,
  type: string,
  isHidden: boolean,
  isLocked: boolean,
  tip?: string,
  children?: Array<Item>,
}
const allObjList = ref<Array<Item>>([])
onMounted(() => {
  reloadObjList();
})
function reloadObjList() {
  allObjList.value = []
  window.worldApi.children.forEach(v => {
    const { id, isLocked, isHidden, tip } = v.getData()
    const item: Item = {
      id,
      name: v.name,
      type: v.type,
      isHidden: isHidden || false,
      isLocked: isLocked || false,
      tip,
      children: undefined,
    }
    if (v instanceof GroupBaseEntity) {
      item.name = v.getData().name
      item.children = v.children.map(child => {
        const { id, isLocked, isHidden, tip } = child.getData()
        return {
          id,
          name: child.name,
          type: child.type,
          isHidden: isHidden || false,
          isLocked: isLocked || false,
          tip,
          children: undefined,
        }
      })
    }
    allObjList.value.push(item)
  })
  allObjCount.value = window.worldApi.getAllObjectCount()
}
const position = ref<{ x: number, y: number }>({ x: window.innerWidth / 3, y: 100 })

const emit = defineEmits<{
  (e: 'close'): void,
  // (e: 'onChange', value: BaseEntityClass<BaseObjData>): void,
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
  const thisObj = window.worldApi.children.find(v => v.getData().id === item.id)
  if (thisObj) {
    const zoom2DLevel = canvas2DSceneManage.list[0].level;
    const worldData = window.worldApi.getData();
    const canvasAction = canvas2DSceneManage.list[0].canvasList[1];
    const ctxAction = canvasAction.getContext('2d')!
    const screenX = worldData.x * zoom2DLevel + canvas2DSceneManage.list[0].panOffset.x;
    const screenY = worldData.y * zoom2DLevel + canvas2DSceneManage.list[0].panOffset.y;
    ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
    ctxAction.save()
    ctxAction.translate(screenX, screenY)
    ctxAction.rotate(worldData.angleY * -1)
    thisObj.draw2DActionHandle(ctxAction, zoom2DLevel)
    ctxAction.restore()
  }
}
// function openEditPanel(id: string) {
//   alert(id)
// }
function handleUnLock(item: Item, isLocked: boolean) {
  const thisObj = window.worldApi.children.find(v => v.getData().id === item.id)
  if (thisObj) {
    thisObj.setData({
      ...thisObj.getData(),
      isLocked,
    })
    item.isLocked = isLocked
    message.success(isLocked ? '锁定成功' : '解锁成功', { position: 'top-center' })
    // emit('onChange', thisObj)
  }
}
function handleLocationPosition(position: { x: number, y: number }) {
  console.log('position', position)
  const canvas = canvas2DSceneManage.list[0].canvasList[0]
  if (!canvas) return
  const canvasRect = canvas.getBoundingClientRect()
  const dx = canvasRect.width / 2
  const dy = canvasRect.height / 2
  canvas2DSceneManage.list[0].setPanOffset({
    x: dx - (position.x * canvas2DSceneManage.list[0].level),
    y: dy - (position.y * canvas2DSceneManage.list[0].level),
  })
}
function handleLocation(item: Item) {
  const api = window.worldApi.children.find(v => v.getData().id === item.id)
  if (!api) return

  if (api instanceof PointEntityClass) {
    const { x, y } = api.getData()
    handleLocationPosition({ x, y })
    nextTick(() => {
      handleEnter(item)
    })
  } else if (api instanceof LineEntityClass) {
    const points: Array<{ x: number, y: number }> = api.getData().points
    const centerX = points.reduce((acc, cur) => acc + cur.x, 0) / points.length
    const centerY = points.reduce((acc, cur) => acc + cur.y, 0) / points.length
    handleLocationPosition({ x: centerX, y: centerY })
    nextTick(() => {
      handleEnter(item)
    })
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
        border-top: solid 1px #e9e9e9;
        padding: 4px 0;

        &:first-child {
          border-top: none;
        }

        .info {
          display: flex;
          align-items: center;

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

        .children {
          padding-left: 24px;

          .childItem {
            border-top: solid 1px #e9e9e9;
            padding: 4px 0;
          }
        }
      }
    }
  }
}
</style>