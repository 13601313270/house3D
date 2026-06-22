<template>
  <div class="context-menu" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <div class="configContainer" v-if="boneEditIsShow" style="width: auto;height: auto;">
      <div class="head" @mousedown="startDrag">
        <div class="moveIcon">
          <img src="../assets/move2.svg" alt="move" @mousedown.prevent />
        </div>
        <div class="title">骨骼姿势编辑</div>
        <div class="closeIcon" @mousedown.stop @click="boneEditIsShow = false, emit('close')">
          <img @mousedown.prevent.stop src="../assets/closeWhite.svg" alt="close" />
        </div>
      </div>
      <BoneEdit v-if="boneEditIsShow" :modelValue="modelValue.bone" @update:modelValue="handleUpdateBone" />
    </div>
    <div class="configContainer" v-else>
      <div class="head" @mousedown="startDrag">
        <div class="moveIcon">
          <img src="../assets/move2.svg" alt="move" @mousedown.prevent />
        </div>
        <div class="title">{{ allFileKeysName[typeKey] }}</div>
        <div class="closeIcon" @mousedown.stop @click="emit('close')">
          <img @mousedown.stop.prevent src="../assets/closeWhite.svg" alt="close" />
        </div>
      </div>
      <!-- {{ modelValue }} -->
      <div class="configItemList">
        <div v-for="item in editPropConfigInfo" :key="item.id" class="configItem"
          :class="{ 'title': item.dataType === 'title' }">
          <div class="label title" v-if="item.dataType === 'title'">
            {{ item.label }}
          </div>
          <div class="label" v-else>
            {{ item.label }}
          </div>
          <div v-if="item.dataType === 'button'" class="edit">
            <button class="actionButton" @click="item.value">{{ item.label }}</button>
          </div>
          <DataTypeEdit v-else-if="item.dataType !== 'title'" class="edit" :item="item"
            :modelValue="modelValue[item.id]" :record="modelValue" @update:modelValue="handleUpdate(item.id, $event)" />
        </div>
      </div>
      <div class="buttonGroup">
        <div class="leftGroup">
          <button v-if="typeKey === 'people'" @click="showBoneEdit">姿态编辑</button>
          <button @click="LockObj(!modelValue.isLocked)">{{ modelValue.isLocked ? '解锁' : '锁定' }}</button>
        </div>
        <div style="flex-grow: 1;"></div>
        <button class="deleteButton" @click="deleteContextMenuEntity">删除</button>
      </div>
    </div>
    <!-- <button @click="deleteContextMenuEntity">删除</button> -->
  </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { editItem, allFileKeysName } from '@/entities/index';
import DataTypeEdit from './DataTypeEdit.vue'
import BoneEdit from './boneEdit.vue'
import message from '@/utils/message';

const props = defineProps<{
  typeKey: string
  editPropConfigInfo: editItem[]
  modelValue: Record<string, any>,
  initPosition: {
    x: number,
    y: number
  }
}>()
const boneEditIsShow = ref(false)

const position = ref(props.initPosition)
const EDGE_PADDING = 6

function showBoneEdit() {
  position.value = { x: 0, y: 0 }
  boneEditIsShow.value = true

  nextTick(() => {
    removeIfOutside();
  })
}

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
  (e: 'close'): void
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
function handleUpdateBone(value: Array<{
  name: string,
  value: {
    x: number,
    y: number,
    z: number,
  },
}>) {
  // console.log('vvvvv', value)
  emit('update:modelValue', {
    ...props.modelValue,
    bone: value
  })
  // nextTick(() => {
  //   boneEditIsShow.value = false;
  //   emit('close')
  // })
}
// 重新修正位置，防止超出父元素范围
function removeIfOutside() {
  const contextMenuEl = document.querySelector('.context-menu') as HTMLElement
  if (!contextMenuEl) return

  const parentEl = contextMenuEl.parentElement
  if (!parentEl) return

  const parentRect = parentEl.getBoundingClientRect()

  const contextMenuRect = contextMenuEl.getBoundingClientRect()
  const panelWidth = contextMenuRect.width
  const panelHeight = contextMenuRect.height
  const maxLeft = parentRect.width - panelWidth - EDGE_PADDING
  const maxTop = parentRect.height - panelHeight - EDGE_PADDING

  const clampedLeft = Math.max(EDGE_PADDING, Math.min(position.value.x, maxLeft))
  const clampedTop = Math.max(EDGE_PADDING, Math.min(position.value.y, maxTop))
  position.value = { x: clampedLeft, y: clampedTop }
}

// 锁定后，无法被移动
function LockObj(value: boolean) {
  console.log('锁定')
  emit('update:modelValue', {
    ...props.modelValue,
    isLocked: value,
  })
  const messageText = (() => {
    if (value) {
      return '锁定成功。如想重新编辑，请去[对象列表]解锁。'
    } else {
      return '解锁成功。'
    }
  })();
  message.success(messageText, {
    duration: 5000,
    position: 'top-center',
  })
}
</script>
<style scoped lang="less">
.context-menu {
  position: absolute;
  background: white;
  // border: 1px solid #d9d9d9;
  box-sizing: border-box;
  border-radius: 8px;
  box-shadow: 0 0 14px 3px rgba(0, 0, 0, 0.65);
  z-index: 1000;
  max-height: 85vh;
  overflow: hidden;
  display: flex;

  &.fallHeight {
    height: 85vh;

    .configContainer {
      height: 100%;
    }
  }

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
      // border: 1px solid red; // #d9d9d9;

      .configItem {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
        padding-bottom: 6px;
        border-bottom: solid 1px #f3f3f3;
        flex-wrap: wrap;

        &.title {
          margin-bottom: 0;
          border-bottom: none;
          margin-top: 16px;

          &:first-child {
            margin-top: 0;
          }
        }

        &:last-child {
          margin-bottom: 0;
          border-bottom: none;
        }

        .label {
          flex-shrink: 0;
          min-width: 70px;
          text-align: left;

          &.title {
            color: #000000;
            font-weight: bold;
            text-align: center;
            width: 100%;
            font-size: 16px;
            line-height: 30px;
            background: #e5e5e5;
          }
        }

        .edit {
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: end;

          .actionButton {
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            background: #e4e6eb;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
          }
        }
      }
    }

    .buttonGroup {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 12px;

      .leftGroup {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

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
