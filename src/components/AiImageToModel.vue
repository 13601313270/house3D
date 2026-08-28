<template>
  <teleport to="#teleport">
    <div class="aiImageToModel" @click.self="handleClose">
      <div class="modalInner">
        <div class="header">
          <div class="title">AI图生模型</div>
          <button class="close-btn" @click="handleClose">&times;</button>
        </div>
        <div class="content">
          <div v-if="resultText || isQuerying" class="result-section">
            <div class="section-title">{{ isQuerying ? '生成进度' : '提交结果' }}</div>
            <div class="result-text">{{ resultText }}</div>
            <div v-if="currentJobId && !resultUrl" class="job-id">Job ID：{{ currentJobId }}</div>
            <Hunyuan3DItem :PreviewImageUrl="resultPreviewImgUrl" :Url="resultUrl" @useFile="handleUseFile" />
          </div>
          <div v-else>
            <div class="upload-section">
              <div class="section-title">上传图片</div>
              <div class="upload-area" :class="{ 'has-image': imageBase64 }" @click="triggerFileInput"
                @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop">
                <img v-if="imageBase64" :src="imageBase64" class="preview-img" alt="预览" />
                <div v-else class="upload-hint">
                  <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round"
                      stroke-linejoin="round" />
                    <polyline points="17 8 12 3 7 8" stroke-linecap="round" stroke-linejoin="round" />
                    <line x1="12" y1="3" x2="12" y2="15" stroke-linecap="round" />
                  </svg>
                  <span>点击或拖拽上传图片</span>
                  <span class="format-hint">支持 JPG / PNG 等常见格式</span>
                </div>
              </div>
              <input type="file" ref="fileInputRef" accept="image/*" style="display: none" @change="handleFileChange" />
              <button v-if="imageBase64" class="reupload-btn" @click="triggerFileInput">重新上传</button>
            </div>

            <div class="action-section">
              <div class="submit-btn" :class="{ disabled: !imageBase64 || isSubmitting || isQuerying }"
                @click="handleSubmit">
                <div v-if="isSubmitting" class="loading-text">提交中...</div>
                <div v-else-if="isQuerying" class="loading-text">
                  <span class="spinner"></span>生成中...
                </div>
                <div v-else>开始生成模型</div>
              </div>
            </div>
          </div>
          <div class="list">
            <div class="section-title" v-if="exitList.length > 0">已完成任务</div>
            <div class="hunyuan3DList" v-if="exitList.length > 0">
              <Hunyuan3DItem v-for="value in exitList" :PreviewImageUrl="value.previewImage" :Url="value.zip"
                @useFile="handleUseFile" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { Store } from '@/store'
import message from '@/utils/message'
import request from '@/utils/request'
import { startLoading, stopLoading } from '@/utils/loadingIcon'
import { sleep } from '@/utils/sleep'
import Hunyuan3DItem from './hunyuan3DItem.vue'

const store = useStore<Store>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const imageBase64 = ref('')
const isSubmitting = ref(false)
const isQuerying = ref(false)
const currentJobId = ref('')
const resultPreviewImgUrl = ref('')
const resultText = ref('')
const resultType = ref('')
const resultUrl = ref('')
const exitList = ref<Array<{
  fileSize: number,
  id: number,
  jobId: string,
  name: string,
  previewImage: string
  status: number
  uid: number,
  zip: string,
}>>([])
let stopPolling = false
onMounted(async () => {
  const res = await request.get(`/video/hunyuan3D/allHunyuanTo3DRapidJob`)
  if (res.status === 200) {
    exitList.value = res.data;
  }
})

const handleClose = () => {
  if (isSubmitting.value) {
    message.warning('正在提交中，请稍候...')
    return
  }
  if (isQuerying.value) {
    stopPolling = true
  }
  emit('close')
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const readFileAsBase64 = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageBase64.value = e.target?.result as string
    resultPreviewImgUrl.value = ''
    resultType.value = ''
    resultText.value = ''
    resultUrl.value = ''
  }
  reader.readAsDataURL(file)
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    readFileAsBase64(file)
  }
  target.value = ''
}

const onDragOver = () => { }
const onDragLeave = () => { }
const onDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    readFileAsBase64(file)
  } else {
    message.error('请上传图片文件')
  }
}

const queryJobStatus = async (jobId: string) => {
  isQuerying.value = true
  stopPolling = false
  const maxAttempts = 75
  const interval = 4000

  for (let i = 0; i < maxAttempts; i++) {
    if (stopPolling) {
      isQuerying.value = false
      return
    }
    await sleep(interval)
    if (stopPolling) {
      isQuerying.value = false
      return
    }
    try {
      const res = await request.get(`/video/hunyuan3D/queryHunyuanTo3DRapidJob/${jobId}`)
      console.log('query result:', res.data)
      const response = res.data?.Response
      if (response) {
        const status: 'RUN' | 'DONE' = response.Status
        if (status === 'DONE') {
          const { PreviewImageUrl, Type, Url } = response.ResultFile3Ds[0];
          resultUrl.value = Url
          resultPreviewImgUrl.value = PreviewImageUrl
          resultType.value = Type
          resultText.value = '模型生成成功，可点击下方链接下载'
          message.success('模型生成成功', { duration: 6000 })
          isQuerying.value = false
          return
        } else if (status === 'RUN') {
          resultPreviewImgUrl.value = ''
          resultType.value = ''
          resultText.value = `正在生成模型...（已查询 ${i + 1} 次）`
        }
      }
    } catch (error) {
      console.error('查询任务状态失败:', error)
    }
  }
  if (!stopPolling) {
    resultPreviewImgUrl.value = '';
    resultType.value = ''
    resultText.value = `查询超时，任务可能仍在处理中。Job ID：${jobId}`
    message.warning('查询超时，任务可能仍在处理中', { duration: 10000 })
  }
  isQuerying.value = false
}

const handleSubmit = async () => {
  if (!imageBase64.value || isSubmitting.value) return

  if (!store.state.main.userInfo) {
    message.warning('请先登录')
    window.showLoginDialog()
    return
  }

  isSubmitting.value = true
  resultPreviewImgUrl.value = ''
  resultType.value = ''
  resultText.value = ''
  resultUrl.value = ''

  try {
    startLoading()
    const response = await request.post('/video/hunyuan3D/submitHunyuanTo3DRapidJob', {
      imageBase64: imageBase64.value,
    }).finally(() => {
      stopLoading()
    })

    if (response.status === 200) {
      const data = response.data
      console.log('=====data======')
      console.log(data)
      if (data.result) {
        const jobId = data.data
        console.log(jobId)
        currentJobId.value = jobId
        resultPreviewImgUrl.value = ''
        resultType.value = ''
        resultText.value = '任务已提交，正在生成模型...'
        message.success('任务提交成功，正在生成模型', { duration: 6000 })
        queryJobStatus(jobId)
      } else {
        message.error(data.error)
      }
    } else {
      message.error(response.statusText || '提交失败')
    }
  } catch (error: any) {
    console.error('AI图生模型提交失败:', error)
    if (error?.response?.status === 401) {
      message.error('请先登录')
      window.showLoginDialog()
    } else {
      message.error(error?.response?.data?.message || error?.message || '提交失败，请稍后重试', {
        duration: 10000,
      })
    }
  } finally {
    isSubmitting.value = false
  }
}
function handleUseFile(object: any) {
  console.log('useFile-----1', object)
  emit('close');
}
</script>

<style scoped lang="less">
.aiImageToModel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  .modalInner {
    width: 420px;
    max-height: 90vh;
    background: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;

      .title {
        font-size: 18px;
        font-weight: bold;
        color: #333;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: #999;
        cursor: pointer;
        line-height: 1;
        padding: 0 4px;

        &:hover {
          color: #333;
        }
      }
    }

    .content {
      padding: 20px;
      overflow-y: auto;

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 10px;
      }

      .upload-section {
        margin-bottom: 20px;

        .upload-area {
          width: 100%;
          height: 220px;
          border: 2px dashed #d0d0d0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
          overflow: hidden;
          position: relative;

          &:hover {
            border-color: #1677ff;
            background-color: #f5f9ff;
          }

          &.has-image {
            border-style: solid;
            border-color: #e0e0e0;
          }

          .preview-img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }

          .upload-hint {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: #999;

            .upload-icon {
              width: 40px;
              height: 40px;
            }

            span {
              font-size: 14px;
            }

            .format-hint {
              font-size: 12px;
              color: #bbb;
            }
          }
        }

        .reupload-btn {
          margin-top: 10px;
          width: 100%;
          padding: 8px;
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          color: #666;
          font-size: 13px;
          cursor: pointer;

          &:hover {
            background: #eef5ff;
            border-color: #1677ff;
            color: #1677ff;
          }
        }
      }

      .action-section {
        .submit-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
          color: white;
          font-size: 16px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          box-sizing: border-box;

          &:hover {
            opacity: 0.9;
          }

          &.disabled {
            background: #ccc;
            cursor: not-allowed;
            opacity: 0.7;
          }

          .loading-text {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;

            .spinner {
              width: 14px;
              height: 14px;
              border: 2px solid rgba(255, 255, 255, 0.4);
              border-top-color: #fff;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }
          }
        }
      }

      .result-section {
        padding: 16px;
        background: #f9fafc;
        border-radius: 8px;
        border: 1px solid #e8e8e8;

        .result-text {
          font-size: 14px;
          color: #333;
          line-height: 1.6;
          margin-bottom: 8px;
          word-break: break-all;
        }

        .job-id {
          font-size: 12px;
          color: #999;
          margin-bottom: 12px;
          word-break: break-all;
        }
      }

      .list {
        margin-top: 20px;
      }
    }

    .hunyuan3DList {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
