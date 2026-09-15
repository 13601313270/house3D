<template>
  <div>
    <div class="preview" v-if="typeSelect === 1">
      <img v-if="modelValue" :src="modelValue" alt="img" class="img" />
      <img v-else src="../assets/Empty.png" alt="noMaterial" class="img" />
    </div>
    <div class="preview" v-else>
      <img v-if="modelValue.startsWith(importImgFileHead)" :src="importFile || ''" alt="img" class="img" />
      <img v-else-if="modelValue.startsWith('https://')" :src="modelValue" alt="img" class="img" />
      <img v-else src="../assets/Empty.png" alt="noMaterial" class="img" />
      <div v-if="modelValue.startsWith(importImgFileHead)" @click="emits('update:modelValue', '')" class="closeButton">
        <img src="../assets/close.svg" alt="noMaterial" class="img" />
      </div>
    </div>
    <div class="imgEditContainer">
      <select class="typeSelect" v-model="typeSelect" @change="changeTypeSelect">
        <option :value="1">{{ t('imgEdit.url') }}</option>
        <option :value="2">{{ t('imgEdit.file') }}</option>
      </select>
      <input class="urlInput" v-if="typeSelect === 1" :value="modelValue" @change="updateEditPropInputInfo($event)"
        type="text" :placeholder="t('imgEdit.urlPlaceholder')" />
      <div v-else class="fileInput" @click="fileInput!.click()">
        {{ t('imgEdit.upload') }}
      </div>
      <input style="display: none;" ref="fileInput" type="file" accept="image/*" @change="handleFileChange" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { t } from '@/i18n';
import { editItem } from '@/utils/editItem';
import { importImgFileHead, ImportImgType } from '@/entities/allObjs';
import { useStore } from 'vuex';
import { Store } from '@/store';
import OSS from 'ali-oss';
import service from '@/utils/request';
import message from '@/utils/message';
import formattedFileSize from '@/utils/formattedFileSize';
import computeFileMD5 from '@/utils/computeFileMD5';
const store = useStore<Store>()

const typeSelect = ref(1)
const fileInput = ref<HTMLInputElement>()

onMounted(() => {
  if (props.modelValue.startsWith(importImgFileHead) || store.state.main.saveByFile) {
    typeSelect.value = 2
  } else {
    typeSelect.value = 1
  }
})

const importFile = computed<string | null>(() => {
  for (const item of window.worldState.allImportImgs) {
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

async function handleFileChange(event: Event) {
  // 去除旧的文件
  if (props.modelValue.startsWith(importImgFileHead)) {
    const index = window.worldState.allImportImgs.findIndex(item => item.fileTypeId === props.modelValue)
    if (index > -1) {
      window.worldState.allImportImgs.splice(index, 1)
    }
  }
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const type = file?.type.split('/')[1]
  if (store.state.main.saveByFile) {
    const fileTypeId = `${importImgFileHead}${Date.now()}.${type}`
    // 创建自定义的 ObjItem 用于
    const customObjItem: ImportImgType = {
      fileTypeId,
      file,
    }
    // 添加到 allImportImgs
    window.worldState.allImportImgs.push(customObjItem)
    emits('update:modelValue', fileTypeId)
  } else {
    // @ts-ignore
    console.log('event.target.value', event.target.value)
    // 如果不保存成文件，那么需要把文件上传上去转换成url
    const mySpaceResponse = await service.get('/video/materialLibrary/mySpace');
    if (mySpaceResponse.data.freeSpace < 0) {
      const { freeSpace, usedSpace, totalSize } = mySpaceResponse.data
      message.error(t('import.spaceInsufficient', formattedFileSize(freeSpace * 1000), formattedFileSize(usedSpace * 1000), formattedFileSize(totalSize * 1000)))
      return;
    }
    const respnse = await service.get('/video/materialLibrary/getUploadKey');

    if (respnse.data.result) {
      const token: {
        AccessKeyId: string,
        AccessKeySecret: string,
        SecurityToken: string,
      } = respnse.data.data;
      console.log(token)
      const client = new OSS({
        region: 'oss-cn-beijing', // 这里需要根据你的bucket实际region填写
        accessKeyId: token.AccessKeyId,
        accessKeySecret: token.AccessKeySecret,
        stsToken: token.SecurityToken, // 注意这里参数名是 stsToken
        bucket: 'video-user-obj', // 替换为你的bucket名称
        secure: true, // 推荐使用HTTPS
        timeout: 240000,// 120 秒
      });

      // 3. 计算文件MD5并执行上传
      try {
        const fileMD5 = await computeFileMD5(file)
        const extension = getFileExtension(file.name)
        const ossObjectName = fileMD5 + extension
        // 使用 put 方法上传，第一个参数是存储在OSS中的对象名（MD5+扩展名），第二个参数是文件对象
        const result = await client.put(ossObjectName, file, {
          headers: {
            'Content-Type': type, // 可选，设置正确的MIME类型
          },
        });
        console.log('上传成功:', result);
        if (result) {
          const { url } = result;
          console.log('上传成功:url', url);
          emits('update:modelValue', url)
        }
      } catch (err) {
        console.error('上传失败:', err);
      }
    } else {
      message.error(respnse.data.data)
    }
  }
}

const getFileExtension = (name: string): string => {
  const lastDot = name.lastIndexOf('.')
  return lastDot !== -1 ? name.slice(lastDot) : ''
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
    const index = window.worldState.allImportImgs.findIndex(item => item.fileTypeId === props.modelValue)
    if (index > -1) {
      window.worldState.allImportImgs.splice(index, 1)
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
  height: 100px;
  position: relative;

  >img {
    height: 100px;
  }

  .closeButton {
    position: absolute;
    top: 0;
    right: 0;
    cursor: pointer;
    padding: 8px;

    >img {
      height: 24px;
    }
  }
}

.imgEditContainer {
  display: flex;
  margin-top: 4px;

  .typeSelect {
    border: solid 1px #b2b2b2;
    border-right: none;
    border-radius: 8px 0 0 8px;
    color: #666666;
    font-size: 14px;
    height: 32px;
    width: 80px;
    flex-shrink: 0;
    text-align: center;

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
    padding-left: 16px;
    flex-grow: 1;
    border: solid 1px #b2b2b2;
    border-radius: 0 8px 8px 0;
    height: 32px;
    line-height: 30px;
    width: 150px;
    box-sizing: border-box;
    color: #666666;
    font-size: 14px;
  }
}
</style>
