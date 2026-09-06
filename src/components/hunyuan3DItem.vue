<template>
  <div class="hunyuan3DItem">
    <div class="PreviewImageUrl">
      <img v-if="item.previewImage" :src="item.previewImage" />
      <div v-else-if="item.status === 0">模型生成中</div>
    </div>
    <div class="delete-btn" @click="deleteTask">删除</div>
    <div class="tools" v-if="item.zip">
      <!-- <a :href="Url" target="_blank" class="download-btn" download>
        下载模型
      </a> -->
      <div :href="item.zip" class="download-btn" @click="useFile">
        使用模型
      </div>
      <div :href="item.zip" class="download-btn" @click="moveModelToPersonalLibrary">
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
const emits = defineEmits(['useFile', 'delete'])
const props = defineProps<{
  item: {
    id: number,
    previewImage: string,
    zip: string,
    status: number,
  },
}>()
async function useFile() {
  const url = props.item.zip;
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
  const res = await request.get(`/video/hunyuan3D/moveToMaterialLibrary/${props.item.id}`)
  console.log('res', res)
  if (res.status === 200 && res.data.result) {
    message.success('迁移成功')
    useFile()
  } else {
    message.error(res.data.data)
  }
}
function deleteTask() {
  if (!confirm(`确定要删除这个任务以及模型吗？`)) {
    return
  }
  request.delete(`/video/hunyuan3D/delete/${props.item.id}`).then(res => {
    console.log('res', res);
    if (res.status === 200 && res.data) {
      message.success('删除成功')
      emits('delete')
    } else {
      message.error(res.data)
    }
  })
}
</script>
<style lang="less">
.hunyuan3DItem {
  position: relative;
  border: solid 1px rgb(125, 125, 125);
  border-radius: 8px;
  width: 300px;
  overflow: hidden;

  .delete-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1;
    padding: 4px 12px;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    font-size: 13px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #ff4d4f;
    }
  }

  .PreviewImageUrl {
    width: 300px;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #333;

    >img {
      width: 300px;
      height: 300px;
    }
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