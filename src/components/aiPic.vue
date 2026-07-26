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
        <div class="section-title">参考图片（最多3张）</div>
        <div class="image-list">
          <div class="image-item">
            <img v-if="initialImage" :src="initialImage" alt="" class="preview-img" />
            <div v-else class="upload-hint">
              <svg class="plus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" stroke-linecap="round" />
              </svg>
            </div>
            <span class="imgIndex">图1</span>
          </div>
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
        <div class="generate-btn" :disabled="isGenerating || !initialImage || !prompt" @click="handleGenerate">
          <div v-if="isGenerating" class="loading-text">生成中...</div>
          <div v-else style="display: flex; align-items: center;">
            <span>生成图片&nbsp;（</span>
            <img src="money.png" />
            <span>6金币）</span>
          </div>
        </div>
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
import { ref } from 'vue'
import { useStore } from 'vuex';
import { Store } from '@/store';
import message from '@/utils/message';
import request from '@/utils/request';
import { startLoading, stopLoading } from '@/utils/loadingIcon';

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

const images = ref<string[]>(['', ''])
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
    image: './aiStyle/1.jpg'
  },
  {
    name: '吉卜力风',
    prompt: 'Studio Ghibli inspired, soft watercolor, warm sunlight, hand painted background, whimsical atmosphere',
    image: './aiStyle/2.jpg'
  },
  {
    name: '动漫',
    prompt: 'anime style, clean lineart, vibrant colors, cel shading, high quality anime illustration',
    image: './aiStyle/3.jpg'
  },
  {
    name: 'Pixar 3D',
    prompt: 'stylized 3D render, Pixar inspired, soft global illumination, detailed materials, cute proportions',
    image: './aiStyle/4.jpg'
  },
  {
    name: '游戏CG',
    prompt: 'AAA game art, Unreal Engine, high quality rendering, realistic materials, dynamic lighting, cinematic composition',
    image: './aiStyle/5.jpg'
  },
  {
    name: '油画',
    prompt: 'oil painting, visible brush strokes, canvas texture, classical art, rich colors',
    image: './aiStyle/6.jpg'
  },
  {
    name: '国风',
    prompt: 'Chinese ink painting, traditional Chinese aesthetics, elegant composition, ink wash, soft brushwork',
    image: './aiStyle/7.jpg'
  },
  {
    name: '儿童绘本',
    prompt: 'children\'s book illustration, watercolor texture, soft pastel colors, hand painted, friendly, storybook illustration',
    image: './aiStyle/8.jpg'
  }
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
    // @ts-ignore
    // document.getElementById("favicon").href = "/faviconLoading.ico";
    startLoading()
    const response: {
      data: qwenImageEditRes,
      status: number,
      statusText: string,
    } = await request.post('/video/ai/qwenImageEdit', {
      imgUrls: [
        props.initialImage,
        ...images.value.filter(v => v),
      ],
      prompt: prompt.value,
      size: `${props.imageSize.width}*${props.imageSize.height}`,
    }).finally(() => {
      stopLoading()
    })
    console.log('response:', response)
    if (response.status === 200) {
      if (response.data.output) {
        generatedImage.value = response.data.output.choices[0].message.content[0].image
        message.success('生成图片成功', {
          duration: 6000,
        })
        request.get('/video/user/info').then(res => {
          console.log(res)
          if (res.status === 200) {
            store.dispatch('main/setUserInfo', res.data)
          }
        })
      } else {
        // @ts-ignore
        message.error(response.data.statusText || '生成图片失败', {
          duration: 10000,
        })
        return
      }
    } else {
      message.error(response.statusText || '生成失败')
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
      max-width: 1000px;

      .image-list {
        display: flex;
        gap: 12px;
        margin-top: 12px;
        overflow-x: scroll;

        .image-item {
          position: relative;
          height: 400px;
          border: 2px dashed #d9d9d9;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
          flex-shrink: 0;

          &.empty {
            width: 130px;
          }

          &:hover {
            // transform: scale(1.2);
            z-index: 1;
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
      max-width: 1000px;

      .templates-list {
        display: flex;
        flex-wrap: wrap;
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
            transform: translateY(-2px) scale(1.4);
            box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
          }

          .template-image {
            width: 226px;
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
      max-width: 1000px;

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
      max-width: 1000px;
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

        img {
          height: 18px;
          margin: 0 2px;
        }

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
      max-width: 1000px;
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