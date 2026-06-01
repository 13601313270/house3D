<template>
  <div class="context-menu" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <div class="configContainer" v-if="showBoneEdit">
      <div class="head">
        <div class="moveIcon" @mousedown="startDrag">
          <img src="../assets/move2.svg" alt="move" @mousedown.prevent />
        </div>
        <div class="title">骨骼姿势编辑</div>
        <div class="closeIcon" @click="showBoneEdit = false">
          <img src="../assets/close.svg" alt="close" />
        </div>
      </div>
      <div>
        <BoneEdit v-if="showBoneEdit" />
      </div>
    </div>
    <div class="configContainer" v-else>
      <div class="head">
        <div class="moveIcon" @mousedown="startDrag">
          <img src="../assets/move2.svg" alt="move" @mousedown.prevent />
        </div>
        <div class="title">{{ allFileKeysName[typeKey] }}</div>
        <div class="closeIcon"></div>
      </div>
      <!-- {{ modelValue }} -->
      <div class="configItemList">
        <div v-for="item in editPropConfigInfo" :key="item.id" class="configItem">
          <div class="label">
            {{ item.label }}：
          </div>
          <div>
            <!-- {{ item }} -->
            <DataTypeEdit :item="item" :modelValue="modelValue[item.id]"
              @update:modelValue="handleUpdate(item.id, $event)" />
          </div>
        </div>
      </div>
      <div class="buttonGroup">
        <button v-if="typeKey === 'people'" @click="showBoneEdit = true">骨骼编辑</button>
        <div style="flex-grow: 1;"></div>
        <button class="deleteButton" @click="deleteContextMenuEntity">删除</button>
      </div>
    </div>
    <!-- <button @click="deleteContextMenuEntity">删除</button> -->
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { editItem, allFileKeysName } from '@/entities/index';
import DataTypeEdit from './DataTypeEdit.vue'
import BoneEdit from './boneEdit.vue'

const props = defineProps<{
  typeKey: string
  editPropConfigInfo: editItem[]
  modelValue: Record<string, any>,
  initPosition: {
    x: number,
    y: number
  }
}>()
const showBoneEdit = ref(false)

const position = ref(props.initPosition)
const EDGE_PADDING = 6

onMounted(() => {
  const contextMenuEl = document.querySelector('.context-menu') as HTMLElement
  if (contextMenuEl) {
    const parentEl = contextMenuEl.parentElement
    if (parentEl) {
      const parentRect = parentEl.getBoundingClientRect()
      const contextMenuRect = contextMenuEl.getBoundingClientRect()
      const maxTop = parentRect.height - contextMenuRect.height - EDGE_PADDING
      const clampedTop = Math.max(EDGE_PADDING, Math.min(position.value.y, maxTop))
      position.value = { ...position.value, y: clampedTop }
    }
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'deleteContextMenuEntity'): void
}>()

function handleUpdate(id: string, value: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [id]: value
  })
}
function deleteContextMenuEntity() {
  emit('deleteContextMenuEntity')
}

let isDragging = false
let offsetX = 0
let offsetY = 0

function startDrag(e: MouseEvent) {
  isDragging = true
  const contextMenuEl = document.querySelector('.context-menu') as HTMLElement
  if (contextMenuEl) {
    const parentEl = contextMenuEl.parentElement
    if (parentEl) {
      const parentRect = parentEl.getBoundingClientRect()
      const contextMenuRect = contextMenuEl.getBoundingClientRect()
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
</script>
<style scoped lang="less">
.context-menu {
  position: absolute;
  width: 340px;
  background: white;
  // border: 1px solid #d9d9d9;
  box-sizing: border-box;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.65);
  z-index: 1000;
  max-height: 80vh;
  overflow: auto;

  .configContainer {

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
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
      padding: 8px;
      // border: 1px solid red; // #d9d9d9;

      .configItem {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin: 12px 0;

        .label {
          flex-shrink: 0;
        }
      }
    }

    .buttonGroup {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding: 8px;

      button {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        background: #e4e6eb;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s;

        // display: block;
        // padding: 8px 16px;
        // border: none;
        // background: transparent;
        // text-align: left;
        // cursor: pointer;
        // font-size: 14px;
        // color: #ff4d4f;
        // border: solid 1px #ff4d4f;

        &:hover {
          background: #f5f5f5;
        }

        &.deleteButton {
          color: #ff4d4f;
          background-color: transparent;
          border: solid 1px #ff4d4f;
        }
      }
    }
  }
}
</style>
