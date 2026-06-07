<template>
  <div>
    <div class="imgEditContainer">
      <select class="typeSelect" v-model="typeSelect">
        <option :value="1">网址</option>
        <option :value="2">上传文件</option>
      </select>
      <input class="urlInput" v-if="typeSelect === 1" :value="modelValue" @change="updateEditPropInputInfo($event)"
        type="text" placeholder="请输入网址" />
      <input class="fileInput" v-else type="file" accept="image/*" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { editItem } from '@/entities';

const typeSelect = ref(1)

const props = defineProps<{
  item: editItem,
  modelValue: any
}>()
const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
function updateEditPropInputInfo(event: Event) {
  if (event.target) {
    // @ts-ignore
    console.log(event.target.value as string)
    // @ts-ignore
    emits('update:modelValue', event.target.value as string)
  }
}
</script>
<style scoped lang="less">
.imgEditContainer {
  display: flex;

  .typeSelect {
    border: solid 1px #b2b2b2;
    border-right: none;
    border-radius: 8px 0 0 8px;
    color: #666666;
    height: 32px;
    width: 50px;
    flex-shrink: 0;

    &:focus {
      outline: none;
      box-shadow: none;
    }
  }

  .urlInput {
    flex-grow: 1;
    border: solid 1px #b2b2b2;
    border-radius: 0 8px 8px 0;
    height: 32px;
    max-width: 300px;
    box-sizing: border-box;
  }
}
</style>
