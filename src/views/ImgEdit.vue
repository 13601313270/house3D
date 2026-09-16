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
    <div v-if="historyList.length > 0" class="historyStrip">
      <div class="historyStripLabel">{{ t('imgEdit.existingImages') }}</div>
      <div class="historyStripThumbs">
        <div v-for="item in historyList.slice(0, 3)" :key="item.id" class="historyStripItem" @click="selectHistoryImg(item)">
          <img :src="item.url" :alt="item.name" />
        </div>
        <div class="historyStripMore" @click="openHistory">
          <span>+{{ Math.max(0, historyList.length - 3) }}</span>
          <span class="moreLabel">{{ t('imgEdit.more') }}</span>
        </div>
      </div>
    </div>
    <teleport to="#teleport">
      <div v-if="showHistory" class="history-modal" @click.self="showHistory = false">
        <div class="history-modal-inner">
          <div class="history-header">
            <div class="history-title">{{ t('imgEdit.historyTitle') }}</div>
            <button class="history-close" @click="showHistory = false">×</button>
          </div>
          <div class="history-body">
            <div v-if="historyLoading" class="history-loading">...</div>
            <div v-else-if="historyList.length === 0" class="history-empty">{{ t('imgEdit.historyEmpty') }}</div>
            <div v-else class="history-grid">
              <div v-for="item in historyList" :key="item.id" class="history-item">
                <img :src="item.url" :alt="item.name" class="history-img" @click="selectHistoryImg(item)" />
                <div class="history-delete" @click.stop="deleteHistoryImg(item)">
                  ×
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
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
const showHistory = ref(false)
const historyLoading = ref(false)
const historyList = ref<{ id: string; url: string; name: string }[]>([])

async function fetchHistoryList() {
  try {
    const res = await service.get('/video/userImg/myList')
    historyList.value = res.data || []
  } catch (e) {
    console.error('获取历史图片失败:', e)
    historyList.value = []
  }
}

async function openHistory() {
  showHistory.value = true
  historyLoading.value = true
  await fetchHistoryList()
  historyLoading.value = false
}

function selectHistoryImg(item: { url: string }) {
  emits('update:modelValue', item.url)
  showHistory.value = false
}

async function deleteHistoryImg(item: { id: string }) {
  if (!confirm(t('imgEdit.deleteConfirm'))) return
  try {
    await service.delete('/video/userImg/delete/' + item.id)
    await fetchHistoryList()
  } catch (e) {
    console.error('删除失败:', e)
    alert(t('imgEdit.deleteFailed'))
  }
}

onMounted(() => {
  if (props.modelValue.startsWith(importImgFileHead) || store.state.main.saveByFile) {
    typeSelect.value = 2
  } else {
    typeSelect.value = 1
  }
  fetchHistoryList()
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
    // 如果不要保存成文件模式，那么需要把文件上传上去转换成url
    try {
      const fileSize = file.size
      const mySpaceResponse = await service.get('/video/materialLibrary/mySpace');
      const { freeSpace, usedSpace, totalSize } = mySpaceResponse.data
      if (freeSpace < 0 || freeSpace * 1000 < fileSize) {
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
            await service.post('/video/userImg/upload', {
              url,
            })
            console.log('上传成功:url', url);
            emits('update:modelValue', url)
            fetchHistoryList()
          }
        } catch (err) {
          console.error('上传失败:', err);
        }
      } else {
        message.error(respnse.data.data)
      }
    } catch (e) {
      // @ts-ignore
      if (e.response.status === 401) {
        window.showLoginDialog()
      }
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
    flex-grow: 1;
    border: solid 1px #b2b2b2;
    border-radius: 0 8px 8px 0;
    height: 32px;
    line-height: 30px;
    width: 150px;
    box-sizing: border-box;
    color: #666666;
    font-size: 14px;
    padding-left: 16px;
    cursor: pointer;
  }
}

.historyStrip {
  margin-top: 6px;
  padding: 8px 10px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 6px;

  .historyStripLabel {
    font-size: 12px;
    color: #888;
    margin-bottom: 6px;
  }

  .historyStripThumbs {
    display: flex;
    gap: 6px;

    .historyStripItem {
      width: 48px;
      height: 48px;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #eaeaea;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &:hover {
        border-color: #1890ff;
      }
    }

    .historyStripMore {
      width: 48px;
      height: 48px;
      border-radius: 4px;
      border: 1px dashed #b2b2b2;
      color: #999;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      line-height: 1.2;

      &:hover {
        border-color: #1890ff;
        color: #1890ff;
      }

      .moreLabel {
        font-size: 10px;
        opacity: 0.8;
      }
    }
  }
}

.history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;

  .history-modal-inner {
    background: white;
    border-radius: 8px;
    width: 600px;
    max-width: 90vw;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid #eaeaea;

      .history-title {
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
      }

      .history-close {
        width: 28px;
        height: 28px;
        border: none;
        background: #f5f5f5;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        line-height: 28px;
        text-align: center;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        &:hover {
          background: #e0e0e0;
          color: #333;
        }
      }
    }

    .history-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;

      .history-loading {
        text-align: center;
        padding: 40px 0;
        color: #999;
      }

      .history-empty {
        text-align: center;
        padding: 40px 0;
        color: #999;
        font-size: 14px;
      }

      .history-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;

        .history-item {
          aspect-ratio: 1 / 1;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
          position: relative;

          &:hover {
            border-color: #1890ff;
            box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
            transform: translateY(-1px);

            .history-delete {
              opacity: 1;
            }
          }

          .history-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .history-delete {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.55);
            color: #fff;
            font-size: 16px;
            line-height: 20px;
            text-align: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;

            &:hover {
              background: #ff4d4f;
            }
          }
        }
      }
    }
  }
}
</style>
