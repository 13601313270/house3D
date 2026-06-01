<template>
  <div class="context-menu" :style="{ top: position.y + 'px', left: position.x + 'px' }">
    <div class="configContainer">
      <div class="head">
        <img class="moveIcon" src="../assets/move2.svg" alt="move" />
        <div class="title">{{ allFileKeysName[typeKey] }}</div>
        <div class="closeIcon"></div>
      </div>
      <!-- {{ typeKey }} -->
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
      <button @click="deleteContextMenuEntity">删除</button>
    </div>
    <!-- <button @click="deleteContextMenuEntity">删除</button> -->
  </div>
</template>
<script setup lang="ts">
import { editItem, allFileKeysName } from '@/entities/index';
import DataTypeEdit from './DataTypeEdit.vue'

const props = defineProps<{
  typeKey: string
  editPropConfigInfo: editItem[]
  modelValue: Record<string, any>,
  position: {
    x: number,
    y: number
  }
}>()

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
      padding: 8px 16px;

      .moveIcon {
        width: 24px;
        height: 24px;
        cursor: move;
      }

      .title {
        font-size: 16px;
        text-align: center;
        flex-grow: 1;
      }

      .closeIcon {
        width: 24px;
        height: 24px;
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
  }

  button {
    display: block;
    width: 100%;
    padding: 8px 16px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    color: #ff4d4f;

    &:hover {
      background: #f5f5f5;
    }
  }
}
</style>
