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
import { EnvironmentConfig } from '../utils/world'
const environmentValue = ref<{
  [key in string]: number | string | boolean
}>()

onMounted(() => {
  const worldApi = (window as any).worldApi
  const savedSkyType = worldApi?.environmentConfig?.skyType || 1
  const savedAmbientLightIntensity = worldApi?.environmentConfig?.ambientLightIntensity ?? 1
  const savedShowGround = worldApi?.environmentConfig?.showGround ?? true
  
  environmentValue.value = {
    skyType: savedSkyType,
    ambientLightIntensity: savedAmbientLightIntensity,
    showGround: savedShowGround,
  }
})
const editPropConfigInfo = ref<editItem[]>([
  {
    id: 'skyType',
    label: '天空种类',
    dataType: 'enum',
    value: 1,
    panelDesc: '天空种类',
    enumList: [
      {
        id: 1,
        name: '白天',
        img: '/skyImg/sky.jpg',
      },
      {
        id: 2,
        name: '清晨',
        img: '/skyImg/sky2.jpg',
      },
      {
        id: 3,
        name: '傍晚',
        img: '/skyImg/sky3.jpg',
      },
      {
        id: 4,
        name: '黄昏',
        img: '/skyImg/sky4.jpg',
      },
      {
        id: 5,
        name: '夜晚（满月）',
        img: '/skyImg/sky5.jpg',
      },
      {
        id: 6,
        name: '夜晚（新月）',
        img: '/skyImg/sky6.jpg',
      },
      {
        id: 7,
        name: '城市白天',
        img: '/skyImg/sky7.jpg',
      },
    ],
  },
  {
    id: 'ambientLightIntensity',
    label: '环境补充光强度',
    dataType: 'number',
    min: 0,
    max: 4,
    step: 0.1,
    value: 1,
  },
  {
    id: 'showGround',
    label: '显示默认地面',
    dataType: 'boolean',
    value: true,
  }
])
function handleUpdate(key: string, value: number | string | boolean) {
  if (environmentValue.value) {
    environmentValue.value[key] = value
    
    const worldApi = (window as any).worldApi
    if (worldApi && worldApi.setEnvironMent) {
      const config: EnvironmentConfig = {
        ...worldApi.environmentConfig,
        [key]: value,
      }
      worldApi.setEnvironMent(config)
    }
  }
}
</script>
<style scoped lang="less">
.content {
  padding: 8px;
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
