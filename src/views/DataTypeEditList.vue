<template>
  <div class="configList">
    {{ typeKey }}
    <!-- {{ modelValue }} -->
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
</template>
<script setup lang="ts">
import { editItem } from '@/entities/index.js';
import DataTypeEdit from './DataTypeEdit.vue'

const props = defineProps({
  typeKey: {
    type: String,
    default: ''
  },
  editPropConfigInfo: {
    type: Array as () => editItem[],
    default: () => []
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

function handleUpdate(id: string, value: any) {
  emit('update:modelValue', {
    ...props.modelValue,
    [id]: value
  })
}
</script>
<style scoped lang="less">
.configList {
  padding: 8px;

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
</style>
