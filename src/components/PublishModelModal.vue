<template>
  <teleport to="#teleport">
    <div v-if="visible" class="publish-model-modal" @click.self="handleClose">
      <div class="publish-model-modal-inner">
        <div class="header">
          <div class="title">公开模型</div>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="body">
          <div class="form-section">
            <div class="form-item">
              <label class="form-label">模型名称</label>
              <input v-model.trim="form.name" class="form-input" type="text" maxlength="30" placeholder="请输入模型名称" />
            </div>

            <div class="form-item">
              <label class="form-label">收费价格（金币）</label>
              <input v-model.number="form.price" class="form-input" type="number" min="0" max="100" step="1"
                placeholder="0-100" @blur="clampPrice" />
              <div class="form-tip">公开后其他用户使用需付费，最多 100 金币，0 表示免费</div>
            </div>

            <div class="form-item">
              <label class="form-label">缩放尺寸</label>
              <input v-model.number="form.scale" class="form-input" type="number" min="0.01" step="0.1"
                placeholder="默认 1" @input="handleScaleChange" />
              <div class="form-tip">右侧预览会按该尺寸实时缩放</div>
            </div>

            <div class="form-actions">
              <button class="btn btn-cancel" @click="handleClose">取消</button>
              <button class="btn btn-confirm" :disabled="submitting" @click="handleSubmit">
                {{ submitting ? '提交中...' : '确认公开' }}
              </button>
            </div>
          </div>

          <div class="preview-section">
            <div class="preview-container" ref="viewportRef"></div>
            <div v-if="modelLoading" class="preview-mask">
              <img src="../assets/loading_white.svg" alt="loading" class="loading-img" />
              <div class="mask-text">模型加载中...</div>
            </div>
            <div v-else-if="modelError" class="preview-mask">
              <div class="mask-text error">{{ modelError }}</div>
            </div>
            <div class="preview-tips">左键拖拽旋转 · 滚轮缩放</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import * as THREE from 'three'
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import service from '@/utils/request'
import processUploadedFile from '@/utils/processUploadedFile'

const props = defineProps<{
  visible: boolean
  item: {
    id: string
    name: string
    file?: string
  } | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const form = reactive({
  name: '',
  price: 0,
  scale: 1,
})

const viewportRef = ref<HTMLDivElement | null>(null)
const modelLoading = ref(false)
const modelError = ref('')
const submitting = ref(false)

// three.js 相关
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let controls: OrbitControls | null = null
let modelObject: THREE.Group | null = null
let animationId: number | null = null
// 模型归一化基准缩放（最大边归一到 100），最终缩放 = baseScale * 用户缩放尺寸
let baseScale = 1

function handleClose() {
  emit('update:visible', false)
}

function clampPrice() {
  if (typeof form.price !== 'number' || isNaN(form.price)) {
    form.price = 0
    return
  }
  form.price = Math.min(100, Math.max(0, Math.round(form.price)))
}

// 根据 BoundingSphere 调整相机位置，保证缩放后模型始终在视野内
function fitCamera() {
  if (!scene || !camera || !controls || !modelObject) return
  const box = new THREE.Box3().setFromObject(modelObject)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const radius = Math.max(size.length() / 2, 1)
  const dist = radius / Math.sin((45 / 2) * Math.PI / 180) * 1.15
  const dir = new THREE.Vector3(0.8, 0.6, 1).normalize()
  camera.position.copy(center).add(dir.multiplyScalar(dist))
  controls.target.copy(center)
  controls.update()
}

// 应用用户输入的缩放尺寸：缩放模型并落到地面上
function handleScaleChange() {
  if (!scene || !modelObject) return
  const scaleNum = typeof form.scale === 'number' && !isNaN(form.scale) && form.scale > 0 ? form.scale : 1
  modelObject.scale.setScalar(baseScale * scaleNum)

  const box = new THREE.Box3().setFromObject(modelObject)
  const center = box.getCenter(new THREE.Vector3())
  modelObject.position.x -= center.x
  modelObject.position.z -= center.z
  modelObject.position.y -= box.min.y

  fitCamera()
}

function initThree() {
  const container = viewportRef.value
  if (!container) return
  const width = container.clientWidth
  const height = container.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(100, 200, 100)
  scene.add(directionalLight)

  const gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xeeeeee)
  scene.add(gridHelper)

  const axesHelper = new THREE.AxesHelper(100)
  scene.add(axesHelper)

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
  camera.position.set(200, 150, 250)
  camera.lookAt(0, 50, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 50, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enablePan = false

  animate()
}

function animate() {
  animationId = requestAnimationFrame(animate)
  controls?.update()
  if (scene && camera) {
    renderer?.render(scene, camera)
  }
}

function disposeScene() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  controls?.dispose()
  controls = null
  if (renderer) {
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
    renderer = null
  }
  if (scene) {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material?.dispose()
        }
      }
    })
    scene = null
  }
  camera = null
  modelObject = null
}

// 下载素材文件并解析为模型对象
async function loadModel() {
  modelLoading.value = true
  modelError.value = ''
  modelObject = null
  try {
    const fileUrl = props.item?.file
    if (!fileUrl) {
      modelError.value = '该素材缺少模型文件，无法预览'
      return
    }
    const response = await fetch(fileUrl)
    const blob = await response.blob()
    const urlPath = new URL(fileUrl, window.location.href).pathname
    const fileName = urlPath.split('/').pop() || 'model'
    const file = new File([blob], fileName, { type: blob.type })

    await processUploadedFile(file, (object) => {
      if (!scene) return
      modelObject = object
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      // 归一化：最大边缩放到 100（与导入素材逻辑一致），再叠加用户缩放尺寸
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      baseScale = maxDim > 0 ? 100 / maxDim : 1

      scene.add(object)
      handleScaleChange()
    })
  } catch (error) {
    console.error('模型加载失败:', error)
    modelError.value = '模型加载失败，请重试'
  } finally {
    modelLoading.value = false
  }
}

function handleSubmit() {
  if (!props.item) return
  if (!form.name) {
    alert('请输入模型名称')
    return
  }
  clampPrice()
  const scaleNum = typeof form.scale === 'number' && !isNaN(form.scale) && form.scale > 0 ? form.scale : 0
  if (!scaleNum) {
    alert('请输入有效的缩放尺寸（大于 0）')
    return
  }
  submitting.value = true
  service.post('/video/materialLibrary/publish', {
    id: props.item.id,
    name: form.name,
    price: form.price,
    scale: scaleNum,
  }).then(() => {
    emit('success')
    handleClose()
  }).catch((error: any) => {
    console.error('公开失败:', error)
    alert('公开失败，请重试')
  }).finally(() => {
    submitting.value = false
  })
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.name = props.item?.name ?? ''
      form.price = 0
      form.scale = 1
      nextTick(() => {
        initThree()
        loadModel()
      })
    } else {
      disposeScene()
    }
  }
)
</script>

<style lang="less" scoped>
.publish-model-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1010;

  .publish-model-modal-inner {
    background: white;
    border-radius: 8px;
    width: 860px;
    max-width: 92vw;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #eaeaea;

      .title {
        font-size: 16px;
        font-weight: bold;
        color: #2c3e50;
      }

      .close-btn {
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
        transition: all 0.2s;

        &:hover {
          background: #e0e0e0;
          color: #333;
        }
      }
    }

    .body {
      display: flex;
      gap: 20px;
      padding: 20px;

      .form-section {
        width: 300px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;

        .form-item {
          margin-bottom: 16px;

          .form-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #444;
            margin-bottom: 6px;
          }

          .form-input {
            width: 100%;
            box-sizing: border-box;
            padding: 8px 10px;
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            font-size: 14px;
            color: #333;
            outline: none;
            transition: border-color 0.2s;

            &:focus {
              border-color: #1890ff;
            }
          }

          .form-tip {
            margin-top: 4px;
            font-size: 12px;
            color: #999;
            line-height: 1.5;
          }
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: auto;

          .btn {
            padding: 8px 18px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          }

          .btn-cancel {
            border: 1px solid #d9d9d9;
            background: white;
            color: #595959;

            &:hover {
              border-color: #1890ff;
              color: #1890ff;
            }
          }

          .btn-confirm {
            border: 1px solid #1890ff;
            background: #1890ff;
            color: white;

            &:hover:not(:disabled) {
              background: #40a9ff;
              border-color: #40a9ff;
            }

            &:disabled {
              cursor: not-allowed;
              opacity: 0.7;
            }
          }
        }
      }

      .preview-section {
        flex: 1;
        position: relative;
        min-width: 0;

        .preview-container {
          width: 100%;
          height: 420px;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          overflow: hidden;
          background: #f0f0f0;
        }

        .preview-mask {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(240, 240, 240, 0.8);

          .loading-img {
            width: 36px;
            height: 36px;
            animation: spin 2s linear infinite;
          }

          .mask-text {
            margin-top: 10px;
            font-size: 13px;
            color: #666;

            &.error {
              color: #ff4d4f;
            }
          }
        }

        .preview-tips {
          margin-top: 8px;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
      }
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
