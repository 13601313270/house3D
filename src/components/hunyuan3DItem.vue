<template>
  <div class="hunyuan3DItem">
    <img class="PreviewImageUrl" v-if="PreviewImageUrl" :src="PreviewImageUrl" />
    <div class="tools" v-if="Url">
      <!-- <a :href="Url" target="_blank" class="download-btn" download>
        下载模型
      </a> -->
      <div :href="Url" class="download-btn" @click="useFile">
        使用模型
      </div>
      <div :href="Url" class="download-btn" @click="moveModelToPersonalLibrary">
        迁移到个人素材库并使用
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import handleLoadedObject from "@/utils/handleLoadedObject";
import importOutObj from "@/utils/importOutObj";
import message from "@/utils/message";
import request from "@/utils/request";
import JSZip from "jszip"
const emits = defineEmits(['useFile'])
const props = defineProps<{
  id: number,
  PreviewImageUrl: string,
  Url: string,
}>()
async function useFile() {
  const url = props.Url;
  // 从url中提取文件名
  const fileName = url.split('/').pop() || 'model.glb'
  // 根据zipUrl下载文件并转换成File类型变量
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], fileName, { type: blob.type });
  await importOutObj(file, async (object, file, type, scaleFactor, position) => {
    await handleLoadedObject(object, file, type, scaleFactor, position)
    emits('useFile', object)
  })
}
async function moveModelToPersonalLibrary() {
  const res = await request.get(`/video/hunyuan3D/moveToMaterialLibrary/${props.id}`)
  console.log('res', res)
  if (res.status === 200 && res.data.result) {
    message.success('迁移成功')
    useFile()
  } else {
    message.error(res.data.data)
  }
}
</script>
<style lang="less">
.hunyuan3DItem {
  border: solid 1px rgb(125, 125, 125);
  border-radius: 8px;
  width: 300px;

  .PreviewImageUrl {
    width: 300px;
  }

  .tools {
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .download-btn {
      display: inline-block;
      padding: 8px 16px;
      background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}
</style>