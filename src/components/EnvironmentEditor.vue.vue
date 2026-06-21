<template>
  <EditPanel title="环境设置">
    <div class="content">
      <div class="configItemList" v-if="environmentValue">
        <div class="configItem" v-for="item in editPropConfigInfo" :key="item.id">
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
            :modelValue="environmentValue[item.id]" @update:modelValue="handleUpdate(item.id, $event)" />
        </div>
      </div>
    </div>
  </EditPanel>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EditPanel from './editPanel.vue'
import DataTypeEdit from '@/views/DataTypeEdit.vue'

import { editItem } from '@/entities/index.js';
const environmentValue = ref<{
  [key in string]: number | string | boolean
}>()

onMounted(() => {
  environmentValue.value = {
    ambientLight: 0,
  }
})
const editPropConfigInfo = ref<editItem[]>([
  {
    id: 'ambientLight',
    label: '天光',
    dataType: 'enum',
    value: 0,
    panelDesc: '天光强度',
    enumList: [
      {
        id: 0,
        name: '低',
        img: '',
      },
      {
        id: 1,
        name: '中',
        img: '',
      },
      {
        id: 2,
        name: '高',
        img: '',
      },
    ],
  }
])
function handleUpdate(key: string, value: number | string | boolean) {
  if (environmentValue.value) {
    environmentValue.value[key] = value
  }
}
</script>
<style scoped lang="less">
.content {
  padding: 8px;
  height: 200px;
}

.configItemList {
  padding: 12px;
  overflow-y: auto;
  flex-grow: 1;

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
</style>
