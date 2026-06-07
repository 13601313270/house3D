<template>
  <div>
    <div class="preview" v-if="typeSelect === 1">
      <img v-if="modelValue" :src="modelValue" alt="img" class="img" />
    </div>
    <div class="preview" v-else>
      <img v-if="modelValue.startsWith(importImgFileHead)" :src="importFile || ''" alt="img" class="img" />
    </div>
    <div class="imgEditContainer">
      <select class="typeSelect" v-model="typeSelect" @change="changeTypeSelect">
        <option :value="1">网址</option>
        <option :value="2">选择文件</option>
      </select>
      <input class="urlInput" v-if="typeSelect === 1" :value="modelValue" @change="updateEditPropInputInfo($event)"
        type="text" placeholder="请输入网址" />
      <div v-else class="fileInput" @click="fileInput!.click()">
        上传文件
      </div>
      <input style="display: none;" ref="fileInput" type="file" accept="image/*" @change="handleFileChange" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { editItem } from '@/entities';
import { importImgFileHead, ImportImgType } from '@/entities/allObjs';

const typeSelect = ref(1)
const fileInput = ref<HTMLInputElement>()

onMounted(() => {
  if (props.modelValue.startsWith(importImgFileHead)) {
    typeSelect.value = 2
  } else {
    typeSelect.value = 1
  }
})

const importFile = computed<string | null>(() => {
  for (const item of window.worldApi.allImportImgs) {
    if (item.fileTypeId === props.modelValue) {
      return URL.createObjectURL(item.file)
    }
  }
  return null
})

const props = defineProps<{
  item: editItem,
  modelValue: string
}>()
const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function handleFileChange(event: Event) {
  // 去除旧的文件
  if (props.modelValue.startsWith(importImgFileHead)) {
    const index = window.worldApi.allImportImgs.findIndex(item => item.fileTypeId === props.modelValue)
    if (index > -1) {
      window.worldApi.allImportImgs.splice(index, 1)
    }
  }
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const type = file?.type.split('/')[1]
  const fileTypeId = `${importImgFileHead}${Date.now()}.${type}`
  // 创建自定义的 ObjItem 用于 worldApi
  const customObjItem: ImportImgType = {
    fileTypeId,
    file,
  }
  // 添加到 allImportImgs
  window.worldApi.allImportImgs.push(customObjItem)
  emits('update:modelValue', fileTypeId)
}
function updateEditPropInputInfo(event: Event) {
  if (event.target) {
    // @ts-ignore
    console.log(event.target.value as string)
    // @ts-ignore
    emits('update:modelValue', event.target.value as string)
  }
}
function changeTypeSelect() {
  if (props.modelValue.startsWith(importImgFileHead)) {
    const index = window.worldApi.allImportImgs.findIndex(item => item.fileTypeId === props.modelValue)
    if (index > -1) {
      window.worldApi.allImportImgs.splice(index, 1)
    }
  }
  emits('update:modelValue', '')
}
</script>
<style scoped lang="less">
.preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  >img {
    width: 100%;
    margin-bottom: 8px;
  }
}

.imgEditContainer {
  display: flex;

  .typeSelect {
    border: solid 1px #b2b2b2;
    border-right: none;
    border-radius: 8px 0 0 8px;
    color: #666666;
    font-size: 14px;
    height: 32px;
    width: 75px;
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
    width: 150px;
    box-sizing: border-box;
  }

  .fileInput {
    flex-grow: 1;
    border: solid 1px #b2b2b2;
    border-radius: 0 8px 8px 0;
    height: 32px;
    width: 150px;
    box-sizing: border-box;
    color: #666666;
    font-size: 14px;
    line-height: 32px;
  }
}
</style>
