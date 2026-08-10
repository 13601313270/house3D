<template>
  <teleport to="#teleport">
    <div v-if="visible" class="import-model-confirm" @click.self="handleCancel">
      <div class="import-model-confirm-inner">
        <div class="header">
          <div class="title">模型导入确认</div>
          <button class="close-btn" @click="handleCancel">×</button>
        </div>

        <div class="body">
          <div class="preview-section">
            <div class="preview-container" ref="previewContainerRef"></div>
            <div class="preview-tips">左键拖动旋转视角 · 滚轮缩放</div>
          </div>

          <div class="info-section">
            <div class="info-title">模型信息</div>
            <div class="info-list">
              <div class="info-item">
                <span class="label">文件名：</span>
                <span class="value">{{ fileName }}</span>
              </div>
              <div class="info-item">
                <span class="label">文件类型：</span>
                <span class="value file-type">{{ fileType?.toUpperCase() }}</span>
              </div>
              <div class="info-item">
                <span class="label">文件大小：</span>
                <span class="value">{{ formattedFileSize }}</span>
              </div>
              <div class="info-item">
                <span class="label">缩放比例：</span>
                <span class="value highlight">{{ scaleFactor?.toFixed(4) }}</span>
              </div>
              <div class="info-item" v-if="modelSize">
                <span class="label">模型尺寸：</span>
                <span class="value">
                  {{ modelSize.x.toFixed(2) }} × {{ modelSize.y.toFixed(2) }} × {{ modelSize.z.toFixed(2) }}
                </span>
              </div>
              <div class="info-item" v-if="meshCount !== null">
                <span class="label">网格数量：</span>
                <span class="value">{{ meshCount }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <label class="checkbox-label">
            <input type="checkbox" v-model="addToMaterialLibrary" class="custom-checkbox" />
            <span class="checkbox-text">添加到个人素材库</span>
          </label>
          <div class="footer-btns">
            <button class="btn btn-cancel" @click="handleCancel">取消</button>
            <button class="btn btn-confirm" @click="handleConfirm">确认导入</button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import axios from 'axios';
import service from '@/utils/request';

const props = defineProps<{
  visible: boolean
  object: THREE.Group | THREE.Mesh | null
  file: File | null
  type: string
  scaleFactor: number
  position: THREE.Vector3
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const addToMaterialLibrary = ref(false)
const previewContainerRef = ref<HTMLDivElement | null>(null)
const modelSize = ref<THREE.Vector3 | null>(null)
const meshCount = ref<number | null>(null)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let animationId: number | null = null
let previewObject: THREE.Object3D | null = null

// 相机控制状态
let isDragging = false
let lastMouseX = 0
let lastMouseY = 0
let cameraRadius = 300
let cameraAngleX = 0
let cameraAngleY = Math.PI / 4
let cameraTarget = new THREE.Vector3(0, 0, 0)

const fileName = computed(() => props.file?.name ?? '')
const fileType = computed(() => props.type)
const formattedFileSize = computed(() => {
  if (!props.file) return ''
  const bytes = props.file.size
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
})

const closeModal = () => {
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  closeModal()
}

const handleConfirm = async () => {
  if (addToMaterialLibrary.value) {
    const respnse = await service.get('/video/materialLibrary/getUploadKey');
    const token: {
      AccessKeyId: string,
      AccessKeySecret: string,
      SecurityToken: string,
    } = respnse.data;
    console.log(token)
    const OSS = require('ali-oss');
    const client = new OSS({
      region: 'oss-cn-shanghai', // 这里需要根据你的bucket实际region填写
      accessKeyId: token.AccessKeyId,
      accessKeySecret: token.AccessKeySecret,
      stsToken: token.SecurityToken, // 注意这里参数名是 stsToken
      bucket: 'video-obj', // 替换为你的bucket名称
      // secure: true // 推荐使用HTTPS
    });

    // 3. 执行文件上传
    try {
      // 使用 put 方法上传，第一个参数是存储在OSS中的对象名，第二个参数是文件对象
      const result = await client.put(fileName.value, props.file, {
        headers: {
          'Content-Type': fileType.value, // 可选，设置正确的MIME类型
        }
      });
      console.log('上传成功:', result);
      // result.url 就是文件在OSS上的访问地址
    } catch (err) {
      console.error('上传失败:', err);
    }

    return;
    const formData = new FormData()
    formData.append('file', props.file!)
    formData.append('fileName', fileName.value)
    formData.append('fileType', fileType.value)
    formData.append('scaleFactor', String(props.scaleFactor))
    try {
      const data = service.post('/video/materialLibrary/upload', formData)
      console.log('sssss', data)
      // if (response.data?.code === 0) {
      //   console.log('添加到素材库成功')
      // }
    } catch (error) {
      console.error('添加到素材库失败:', error)
    }
  }
  emit('confirm')
  closeModal()
}

const countMeshes = (obj: THREE.Object3D): number => {
  let count = 0
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) count++
  })
  return count
}

const initPreviewScene = () => {
  if (!previewContainerRef.value) return

  // 清理旧场景
  disposeScene()

  const container = previewContainerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf5f5f5)

  // 创建相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(200, 300, 200)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(1024, 1024)
  scene.add(directionalLight)

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
  directionalLight2.position.set(-200, 100, -200)
  scene.add(directionalLight2)

  // 添加网格辅助
  const gridHelper = new THREE.GridHelper(400, 20, 0xcccccc, 0xe0e0e0)
  scene.add(gridHelper)

  // 添加坐标轴辅助
  const axesHelper = new THREE.AxesHelper(100)
  scene.add(axesHelper)

  // 添加预览模型
  if (props.object) {
    previewObject = props.object.clone()
    previewObject.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    scene.add(previewObject)

    // 计算模型尺寸并调整相机
    const box = new THREE.Box3().setFromObject(previewObject)
    const size = box.getSize(new THREE.Vector3())
    modelSize.value = size
    meshCount.value = countMeshes(previewObject)

    const center = box.getCenter(new THREE.Vector3())
    cameraTarget = center.clone()

    const maxDim = Math.max(size.x, size.y, size.z)
    cameraRadius = maxDim * 2.5
    cameraAngleX = 0
    cameraAngleY = Math.PI / 4

    updateCameraPosition()
  }

  // 开始渲染循环
  animate()
}

const updateCameraPosition = () => {
  if (!camera) return
  const x = cameraRadius * Math.sin(cameraAngleX) * Math.cos(cameraAngleY)
  const y = cameraRadius * Math.sin(cameraAngleY)
  const z = cameraRadius * Math.cos(cameraAngleX) * Math.cos(cameraAngleY)
  camera.position.set(
    cameraTarget.x + x,
    cameraTarget.y + y,
    cameraTarget.z + z
  )
  camera.lookAt(cameraTarget)
}

const animate = () => {
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
  animationId = requestAnimationFrame(animate)
}

const disposeScene = () => {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

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
  previewObject = null
  modelSize.value = null
  meshCount.value = null
}

// 鼠标交互
const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 0) {
    isDragging = true
    lastMouseX = e.clientX
    lastMouseY = e.clientY
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging) return
  const deltaX = e.clientX - lastMouseX
  const deltaY = e.clientY - lastMouseY
  lastMouseX = e.clientX
  lastMouseY = e.clientY

  cameraAngleX += deltaX * 0.01
  const newAngleY = cameraAngleY + deltaY * 0.01
  cameraAngleY = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, newAngleY))
  updateCameraPosition()
}

const handleMouseUp = () => {
  isDragging = false
}

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  const zoomSpeed = 0.001
  const delta = e.deltaY * zoomSpeed
  cameraRadius = Math.max(0.1, Math.min(10000, cameraRadius * (1 + delta)))
  updateCameraPosition()
}

const handleResize = () => {
  if (!previewContainerRef.value || !renderer || !camera) return
  const container = previewContainerRef.value
  const width = container.clientWidth
  const height = container.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initPreviewScene()
      // 绑定事件
      nextTick(() => {
        if (renderer?.domElement) {
          renderer.domElement.addEventListener('mousedown', handleMouseDown)
          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }
        if (previewContainerRef.value) {
          previewContainerRef.value.addEventListener('wheel', handleWheel, { passive: false })
        }
      })
    })
  } else {
    // 解绑事件
    if (renderer?.domElement) {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown)
    }
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    disposeScene()
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  disposeScene()
})
</script>

<style scoped lang="less">
.import-model-confirm {
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

  .import-model-confirm-inner {
    width: 800px;
    max-width: 90vw;
    max-height: 85vh;
    background: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #f0f0f0;
      flex-shrink: 0;

      .title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .close-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        font-size: 24px;
        color: #999;
        cursor: pointer;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        &:hover {
          background: #f5f5f5;
          color: #666;
        }
      }
    }

    .body {
      display: flex;
      flex: 1;
      overflow: hidden;
      min-height: 400px;

      .preview-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #fafafa;
        position: relative;

        .preview-container {
          flex: 1;
          min-height: 350px;
          position: relative;
          cursor: grab;

          &:active {
            cursor: grabbing;
          }
        }

        .preview-tips {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 12px;
          pointer-events: none;
        }
      }

      .info-section {
        width: 280px;
        padding: 20px;
        border-left: 1px solid #f0f0f0;
        overflow-y: auto;
        flex-shrink: 0;

        .info-title {
          font-size: 15px;
          font-weight: 600;
          color: #333;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 14px;

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .label {
              font-size: 13px;
              color: #999;
            }

            .value {
              font-size: 14px;
              color: #333;
              word-break: break-all;

              &.file-type {
                display: inline-block;
                padding: 2px 10px;
                background: #e6f4ff;
                color: #1677ff;
                border-radius: 4px;
                font-weight: 500;
                align-self: flex-start;
              }

              &.highlight {
                font-weight: 600;
                color: #e63946;
                font-size: 16px;
              }
            }
          }
        }
      }
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
      flex-shrink: 0;

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;

        .custom-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #1677ff;
          cursor: pointer;
        }

        .checkbox-text {
          font-size: 14px;
          color: #333;
        }
      }

      .footer-btns {
        display: flex;
        gap: 12px;
      }

      .btn {
        padding: 10px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;

        &.btn-cancel {
          background: #f5f5f5;
          color: #666;

          &:hover {
            background: #e8e8e8;
          }
        }

        &.btn-confirm {
          background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
          color: white;

          &:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
          }
        }
      }
    }
  }
}
</style>
