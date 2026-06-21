<template>
  <div class="environmentEditor" ref="environmentEditorRef"
    :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <div class="environmentEditorContent">
      <div class="head" @mousedown="startDrag">
        <div class="moveIcon">
          <img src="../assets/move2.svg" alt="move" @mousedown.prevent />
        </div>
        <div class="title">{{ title }}</div>
        <div class="closeIcon" @mousedown.stop @click="emit('close')">
          <img @mousedown.prevent.stop src="../assets/closeWhite.svg" alt="close" />
        </div>
      </div>
      <div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const environmentEditorRef = ref<HTMLDivElement>()
const position = ref<{ x: number, y: number }>({ x: window.innerWidth / 3, y: 100 })
let isDragging = false
let offsetX = 0
let offsetY = 0
const EDGE_PADDING = 6
defineProps<{
  title: string,
}>()
function startDrag(e: MouseEvent) {
  isDragging = true
  const contextMenuEl = environmentEditorRef.value
  console.log('contextMenuEl-1', contextMenuEl)
  if (contextMenuEl) {
    console.log('contextMenuEl-2', contextMenuEl)
    const parentEl = contextMenuEl.parentElement
    if (parentEl) {
      console.log('contextMenuEl-3', parentEl)
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

  const contextMenuEl = environmentEditorRef.value
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

const emit = defineEmits<{
  (e: 'close'): void,
}>()
</script>
<style scoped lang="less">
.environmentEditor {
  position: absolute;
  background: white;
  box-sizing: border-box;
  border-radius: 8px;
  box-shadow: 0 0 14px 3px rgba(0, 0, 0, 0.65);
  z-index: 1000;
  max-height: 85vh;
  overflow: hidden;
  display: flex;

  .environmentEditorContent {
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
  }
}
</style>