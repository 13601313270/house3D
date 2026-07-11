<template>
  <div class="aiPic">
    <div class="header">
      <div class="title">AI渲染</div>
      <div style="flex: 1;"></div>
      <div class="userInfo">
        <img src="money.png" />
        <span>{{ store.state.main.userInfo.money }}金币</span>
      </div>
      <button class="close-btn" @click="handleClose">&times;</button>
    </div>

    <div class="content">
      <div class="image-section">
        <div class="basic-image-list">
          <div class="image-item">
            <img v-if="initialImage" :src="initialImage" alt="" class="preview-img" />
            <div v-else class="upload-hint">
              <svg class="plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" stroke-linecap="round" />
              </svg>
            </div>
            <span class="imgIndex">图1</span>
          </div>
        </div>
        <div class="section-title">额外参考图片（最多4张）</div>
        <div class="image-list">
          <div v-for="(image, index) in images" :key="index" class="image-item" :class="{ 'empty': !image }"
            @click="handleImageClick(index)">
            <div v-if="image" style="height: 100%;">
              <img :src="image" alt="" class="preview-img" />
              <span class="imgIndex">{{ `图${index + 2}` }}</span>
            </div>
            <div v-else class="upload-hint">
              <svg class="plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" stroke-linecap="round" />
              </svg>
              <span class="imgIndex">{{ `图${index + 2}` }}</span>
            </div>
            <button v-if="image" class="delete-btn" @click.stop="handleDeleteImage(index)">
              <img src="@/assets/close.svg" alt="删除" />
            </button>
          </div>
        </div>
        <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileChange" />
      </div>

      <div class="prompt-section">
        <div class="section-title">提示词</div>
        <textarea v-model="prompt" class="prompt-input" placeholder="请输入描述图片内容的提示词..." rows="4"></textarea>
      </div>
      <div class="templates-section">
        <div class="section-title">提示词模板</div>
        <div class="templates-list">
          <div v-for="(template, index) in promptTemplates" :key="index" class="template-item"
            @click="applyTemplate(template)">
            <img :src="template.image" :alt="template.name" class="template-image" />
            <div class="template-info">
              <div class="template-name">{{ template.name }}</div>
              <!-- <div class="template-prompt">{{ template.prompt }}</div> -->
            </div>
          </div>
        </div>
      </div>

      <div class="action-section">
        <button class="generate-btn" :disabled="isGenerating || !initialImage || !prompt" @click="handleGenerate">
          <span v-if="isGenerating" class="loading-text">生成中...</span>
          <span v-else>生成图片</span>
        </button>
      </div>

      <div v-if="generatedImage" class="result-section">
        <div class="section-title">生成结果</div>
        <div class="result-container">
          <img :src="generatedImage" alt="生成的图片" class="result-img" />
          <button class="download-btn" @click="handleDownload">
            <svg class="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round" stroke-linejoin="round" />
              <polyline points="7 10 12 15 17 10" stroke-linecap="round" stroke-linejoin="round" />
              <line x1="12" y1="15" x2="12" y2="3" stroke-linecap="round" />
            </svg>
            下载
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import service from '@/utils/request'
import { useStore } from 'vuex';
import { Store } from '@/store';

type qwenImageEditRes = {
  output: {
    choices: Array<{
      finish_reason: string;
      message: {
        content: Array<{
          image: string;
        }>;
        role: string;
      };
    }>;
  };
  usage: {
    height: number;
    image_count: number;
    width: number;
  };
  request_id: string;
}

const props = defineProps<{
  initialImage?: string,
  imageSize: {
    width: number,
    height: number,
  },
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const images = ref<string[]>(['', '', '', ''])
const prompt = ref('')
const generatedImage = ref('')
const isGenerating = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const currentUploadIndex = ref(0)
const store = useStore<Store>()

interface PromptTemplate {
  name: string
  prompt: string
  image: string
}

const promptTemplates = ref<PromptTemplate[]>([
  {
    name: '超真实',
    prompt: '图1为布局草图，生成图片。超写实摄影风格，真实照片质感，电影级画面，高质量摄影作品，8K超高清，细节丰富，真实皮肤纹理，真实毛发细节，真实服装材质，真实光影，PBR材质表现，全局光照，柔和自然光，体积光，景深效果，高动态范围（HDR），专业摄影，电影级调色，高级色彩，空气透视，环境光遮蔽，画面干净通透，真实阴影，真实反射，镜头虚化，照片级真实感，层次丰富，自然不过度锐化，高品质，高细节，大师级作品。',
    image: 'https://s1.aigei.com/src/img/jpg/ca/caf1560fc18149db99ecd27d7103ad60.jpg?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:o8myqx_-syBWhtRuCGy6ESfTzsA='
  },
  // {
  //   name: '北欧风格',
  //   prompt: 'Scandinavian style interior, cozy, warm lighting, wooden furniture, plants, bright and airy, 3D render, high quality',
  //   image: 'https://s1.aigei.com/src/img/jpg/ca/caf1560fc18149db99ecd27d7103ad60.jpg?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:o8myqx_-syBWhtRuCGy6ESfTzsA='
  // },
  // {
  //   name: '中式古典',
  //   prompt: 'Chinese classical interior design, traditional furniture, red lanterns, wooden beams, elegant, cultural, 3D render',
  //   image: 'https://s1.aigei.com/src/img/jpg/ca/caf1560fc18149db99ecd27d7103ad60.jpg?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:o8myqx_-syBWhtRuCGy6ESfTzsA='
  // },
  // {
  //   name: '工业风',
  //   prompt: 'industrial style interior, exposed brick walls, metal pipes, loft design, vintage lighting, concrete floor, 3D render',
  //   image: 'https://s1.aigei.com/src/img/jpg/ca/caf1560fc18149db99ecd27d7103ad60.jpg?imageMogr2/auto-orient/thumbnail/!282x282r/gravity/Center/crop/282x282/quality/85/%7CimageView2/2/w/282&e=2051020800&token=P7S2Xpzfz11vAkASLTkfHN7Fw-oOZBecqeJaxypL:o8myqx_-syBWhtRuCGy6ESfTzsA='
  // }
])

const applyTemplate = (template: PromptTemplate) => {
  prompt.value = template.prompt
}

// onMounted(() => {
//   if (props.initialImage) {
//     // images.value[0] = props.initialImage
//   }
// })

const handleClose = () => {
  emit('close')
}

const handleImageClick = (index: number) => {
  if (images.value[index]) return
  currentUploadIndex.value = index
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      images.value[currentUploadIndex.value] = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
  target.value = ''
}

const handleDeleteImage = (index: number) => {
  images.value[index] = ''
}

const handleGenerate = async () => {
  if (!props.initialImage || isGenerating.value) return
  if (!prompt.value.trim()) {
    alert('请输入提示词')
    return
  }

  isGenerating.value = true
  generatedImage.value = ''

  try {
    const response: {
      data: qwenImageEditRes,
      status: number,
      statusText: string,
    } = await service.post('/video/ai/qwenImageEdit', {
      imgUrls: [
        props.initialImage,
        ...images.value.filter(v => v),
      ],
      prompt: prompt.value,
      size: `${props.imageSize.width}*${props.imageSize.height}`,
    })
    console.log('response:', response)
    if (response.status === 200) {
      generatedImage.value = response.data.output.choices[0].message.content[0].image
    } else {
      alert(response.statusText || '生成失败')
    }
  } catch (error: any) {
    console.error('生成图片失败-------:', error)
    if (error.response.status === 401) {
      alert(error.response.data)
      return
    } else {
      console.error('生成图片失败:', error.response)
      alert('生成图片失败，请重试')
    }
  } finally {
    isGenerating.value = false
  }
}

const dataURLtoBlob = (dataURL: string) => {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

const handleDownload = () => {
  if (!generatedImage.value) return

  const link = document.createElement('a')
  link.download = `ai-generated-${Date.now()}.png`
  link.href = generatedImage.value
  link.click()
}
</script>

<style scoped lang="less">
.aiPic {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  z-index: 1000;
  background: white;
  top: 0;
  left: 0;
  overflow: hidden;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    background: linear-gradient(90deg, #141b44 0%, #190554 100%);
    color: white;
    flex-shrink: 0;
    height: 40px;

    .title {
      font-size: 18px;
      font-weight: bold;
      margin-left: 8px;
    }

    .userInfo {
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;

      >img {
        height: 18px;
        margin-right: 4px;
      }
    }

    .close-btn {
      width: 32px;
      height: 32px;
      margin-left: 8px;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 20px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .content {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;

    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-top: 12px;
    }

    .image-section {
      width: 100%;
      max-width: 800px;

      .basic-image-list {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;

        .image-item {
          position: relative;
          border: 2px dashed #d9d9d9;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;

          .preview-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .upload-hint {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #999;
            gap: 8px;

            .plus-icon {
              width: 24px;
              height: 24px;
            }
          }

          .delete-btn {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 24px;
            height: 24px;
            border: none;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;

            &:hover {
              background: rgba(255, 77, 79, 0.8);
            }

            img {
              width: 12px;
              height: 12px;
            }
          }
        }
      }

      .image-list {
        display: flex;
        gap: 12px;
        margin-top: 12px;

        .image-item {
          position: relative;
          height: 200px;
          border: 2px dashed #d9d9d9;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;

          &.empty {
            width: 130px;
          }

          &:hover {
            border-color: #1890ff;
            background: #f0f5ff;
          }

          &.empty:hover {
            border-color: #1890ff;
          }

          .preview-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .upload-hint {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #999;
            gap: 8px;

            .plus-icon {
              width: 24px;
              height: 24px;
            }
          }

          .delete-btn {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 24px;
            height: 24px;
            border: none;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;

            &:hover {
              background: rgba(255, 77, 79, 0.8);
            }

            img {
              width: 12px;
              height: 12px;
            }
          }
        }
      }
    }

    .imgIndex {
      position: absolute;
      top: 4px;
      left: 4px;
      font-size: 12px;
      color: #fff;
      background: rgba(0, 0, 0, 0.5);
      padding: 2px 4px;
      border-radius: 4px;
      z-index: 100;
    }

    .templates-section {
      width: 100%;
      max-width: 800px;

      .templates-list {
        display: flex;
        gap: 12px;
        margin-top: 12px;

        .template-item {
          display: flex;
          flex-direction: column;
          padding: 6px;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            border-color: #1890ff;
            background: #f0f5ff;
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
          }

          .template-image {
            width: 100px;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
            flex-shrink: 0;
          }

          .template-info {
            flex: 1;
            margin-top: 4px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;

            .template-name {
              font-size: 14px;
              text-align: center;
              font-weight: bold;
              color: #333;
            }

            .template-prompt {
              font-size: 12px;
              color: #666;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
    }

    .prompt-section {
      width: 100%;
      max-width: 800px;

      .prompt-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #d9d9d9;
        border-radius: 8px;
        margin-top: 12px;
        font-size: 14px;
        resize: vertical;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s;

        &:focus {
          border-color: #1890ff;
        }

        &::placeholder {
          color: #999;
        }
      }
    }

    .action-section {
      width: 100%;
      max-width: 800px;
      display: flex;
      justify-content: center;
      margin-top: 12px;

      .generate-btn {
        padding: 12px 48px;
        border: none;
        border-radius: 8px;
        background: linear-gradient(90deg, #1890ff 0%, #096dd9 100%);
        color: white;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .loading-text {
          display: flex;
          align-items: center;
          gap: 8px;

          &::before {
            content: '';
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
        }
      }
    }

    .result-section {
      width: 100%;
      max-width: 800px;
      margin-top: 16px;

      .result-container {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        .result-img {
          width: 100%;
          height: auto;
          display: block;
        }

        .download-btn {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;

          &:hover {
            background: rgba(0, 0, 0, 0.8);
          }

          .download-icon {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>