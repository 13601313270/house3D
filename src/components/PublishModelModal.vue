<template>
  <teleport to="#teleport">
    <div class="publish-model-modal" @click.self="handleClose">
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
              <div class="scale-row">
                <input class="scale-slider" type="range" min="0.1" max="10" step="0.1" v-model.number="form.scale"
                  @input="handleScaleChange" />
                <span class="scale-value">{{ scaleDisplay }}</span>
              </div>
              <div class="form-tip">拖动滑块，右侧预览模型实时缩放</div>
            </div>

            <div class="form-actions">
              <button class="btn btn-cancel" @click="handleClose">取消</button>
              <button class="btn btn-confirm" :disabled="submitting" @click="handleSubmit">
                {{ submitting ? '提交中...' : '保存' }}
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
            <div class="preview-tips">左键拖拽旋转 · 滚轮缩放 · 坐标轴刻度 1 单位 = 1cm</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import service from '@/utils/request'
import processUploadedFile from '@/utils/processUploadedFile'

const props = defineProps<{
  item: {
    id: string
    name: string
    initScale: number
    file?: string
  }
}>()

const emit = defineEmits<{
  (e: 'close', value: boolean): void
  (e: 'success'): void
}>()

const form = reactive({
  name: '',
  price: 0,
  scale: 1,
})

onMounted(() => {
  form.name = props.item?.name ?? ''
  form.price = 0
  form.scale = props.item.initScale;
  nextTick(() => {
    initThree()
    loadModel()
  })
})
const viewportRef = ref<HTMLDivElement | null>(null)
const modelLoading = ref(false)
const modelError = ref('')
const submitting = ref(false)

const scaleDisplay = computed(() => {
  const n = typeof form.scale === 'number' && !isNaN(form.scale) ? form.scale : 1
  return n.toFixed(1) + 'x'
})

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
  emit('close', false)
}

function clampPrice() {
  if (typeof form.price !== 'number' || isNaN(form.price)) {
    form.price = 0
    return
  }
  form.price = Math.min(100, Math.max(0, Math.round(form.price)))
}

// 应用用户输入的缩放尺寸：缩放模型并落到地面上（不重置相机，保证预览中模型真实变大变小）
function handleScaleChange() {
  if (!scene || !modelObject) return
  const scaleNum = typeof form.scale === 'number' && !isNaN(form.scale) && form.scale > 0 ? form.scale : 1
  modelObject.scale.setScalar(baseScale * scaleNum)

  const box = new THREE.Box3().setFromObject(modelObject)
  const center = box.getCenter(new THREE.Vector3())
  modelObject.position.x -= center.x
  modelObject.position.z -= center.z
  modelObject.position.y -= box.min.y
}

// 用 Canvas 生成数字标签 Sprite
function createLabelSprite(text: string, color: string) {
  const fontSize = 64
  const padding = 16
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = `bold ${fontSize}px Arial`
  const textWidth = ctx.measureText(text).width
  canvas.width = Math.ceil(textWidth + padding * 2)
  canvas.height = fontSize + padding * 2
  ctx.font = `bold ${fontSize}px Arial`
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, padding, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  const height = 24
  sprite.scale.set(height * canvas.width / canvas.height, height, 1)
  sprite.renderOrder = 10
  return sprite
}

// 生成带数字刻度的 XYZ 坐标轴，1 单位 = 1cm（X/Z 与网格边缘对齐 500，Y 到 300，每 100cm 一个刻度）
function createRulerAxes() {
  const group = new THREE.Group()
  const step = 100
  const axisConfigs = [
    { dir: 'x' as const, length: 500, color: 0xff4d4f, cssColor: '#ff4d4f' },
    { dir: 'y' as const, length: 300, color: 0x52c41a, cssColor: '#52c41a' },
    { dir: 'z' as const, length: 500, color: 0x1890ff, cssColor: '#1890ff' },
  ]
  const tickSize = 3
  const labelOffset = 9
  const labelY = 4

  for (const cfg of axisConfigs) {
    // 轴线
    const end = new THREE.Vector3(
      cfg.dir === 'x' ? cfg.length : 0,
      cfg.dir === 'y' ? cfg.length : 0,
      cfg.dir === 'z' ? cfg.length : 0
    )
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), end])
    group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: cfg.color })))

    // 刻度线 + 数字标签
    const tickPoints: THREE.Vector3[] = []
    for (let v = step; v <= cfg.length; v += step) {
      if (cfg.dir === 'x') {
        tickPoints.push(new THREE.Vector3(v, -tickSize, 0), new THREE.Vector3(v, tickSize, 0))
        const label = createLabelSprite(v + 'cm', cfg.cssColor)
        label.position.set(v, labelY, 0)
        group.add(label)
      } else if (cfg.dir === 'y') {
        tickPoints.push(new THREE.Vector3(-tickSize, v, 0), new THREE.Vector3(tickSize, v, 0))
        const label = createLabelSprite(v + 'cm', cfg.cssColor)
        label.position.set(-labelOffset, v, 0)
        group.add(label)
      } else {
        tickPoints.push(new THREE.Vector3(-tickSize, 0, v), new THREE.Vector3(tickSize, 0, v))
        const label = createLabelSprite(v + 'cm', cfg.cssColor)
        label.position.set(0, labelY, v)
        group.add(label)
      }
    }
    const tickGeo = new THREE.BufferGeometry().setFromPoints(tickPoints)
    group.add(new THREE.LineSegments(tickGeo, new THREE.LineBasicMaterial({ color: cfg.color })))
  }
  return group
}

// 根据包围球初始化相机取景（仅在模型加载完成时调用一次，之后拖动缩放不再重置相机）
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

  // 带数字刻度的 XYZ 坐标轴（1 单位 = 1cm）
  scene.add(createRulerAxes())

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
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry?.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material?.dispose()
        }
      } else if (obj instanceof THREE.Sprite) {
        const mat = obj.material as THREE.SpriteMaterial
        mat.map?.dispose()
        mat.dispose()
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
      fitCamera()
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
  service.post(`/video/materialLibrary/update/${props.item.id}`, {
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

onUnmounted(() => {
  disposeScene()
})
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

          .scale-row {
            display: flex;
            align-items: center;
            gap: 10px;

            .scale-slider {
              flex: 1;
              height: 4px;
              accent-color: #1890ff;
              cursor: pointer;
            }

            .scale-value {
              min-width: 44px;
              text-align: right;
              font-size: 13px;
              font-weight: 600;
              color: #1890ff;
              font-variant-numeric: tabular-nums;
            }
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
