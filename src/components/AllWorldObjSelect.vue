<template>
  <div class="context-menu" :style="{ top: position.y + 'px', left: position.x + 'px' }">
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
        <div v-for="item in allObjList" :key="item.id" @mouseenter="handleEnter(item)">
          {{ item.name }} {{ item.type }} {{ item.id }} {{ item.isLocked }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
const allObjCount = ref(0)
const allObjList = ref<Array<{
  id: string,
  name: string,
  type: string,
  isLocked: boolean,
}>>([])
const props = defineProps<{
  zoom2DLevel: number,
  panOffset: { x: number, y: number },
}>()
onMounted(() => {
  let newCount = 0;
  for (const key in window.worldApi.allFileMapObjects) {
    if (window.worldApi.allFileMapObjects[key]) {
      newCount += window.worldApi.allFileMapObjects[key].length
      allObjList.value.push(...window.worldApi.allFileMapObjects[key].map((item) => {
        const { id, isLocked } = item.getData()
        return {
          id,
          name: item.name,
          type: item.type,
          isLocked: isLocked || false,
        }
      }))
    }
  }
  allObjCount.value = newCount
})
const position = ref<{ x: number, y: number }>({ x: 100, y: 100 })

const emit = defineEmits<{
  (e: 'close'): void
}>()

let isDragging = false
let offsetX = 0
let offsetY = 0
const EDGE_PADDING = 6
function startDrag(e: MouseEvent) {
  isDragging = true
  const contextMenuEl = document.querySelector('.context-menu') as HTMLElement
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

  const contextMenuEl = document.querySelector('.context-menu') as HTMLElement
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
</script>
<style scoped lang="less">
.context-menu {
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
      padding: 12px;
      overflow-y: auto;
      flex-grow: 1;
    }
  }
}
</style>