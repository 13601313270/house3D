<template>
  <teleport to="#teleport">
    <div v-if="visible" class="material-library-modal" @click.self="handleClose">
      <div class="material-library-modal-inner">
        <div class="header">
          <div class="title">个人素材库管理</div>
          <button class="close-btn" @click="handleClose">×</button>
        </div>
        <div class="body">
          <div v-if="mySpaceInfo" class="space-info">
            <div class="space-info-header">
              <span class="space-info-label">存储空间</span>
              <div class="space-progress-bar">
                <div class="space-progress-fill" :style="{ width: spaceUsagePercent + '%' }"></div>
              </div>
              <span class="space-info-percent">{{ spaceUsagePercent }}%</span>
            </div>
            <div class="space-info-items">
              <div class="space-info-item space-used">
                <span class="item-dot"></span>
                <span class="item-label">已用</span>
                <span class="item-value">{{ formattedFileSize(mySpaceInfo?.usedSpace * 1024) }}</span>
              </div>
              <div class="space-info-item space-total">
                <span class="item-dot"></span>
                <span class="item-label">总计</span>
                <span class="item-value">{{ formattedFileSize(mySpaceInfo?.totalSize * 1024) }}</span>
              </div>
              <div class="space-info-item space-free">
                <span class="item-dot"></span>
                <span class="item-label">可用</span>
                <span class="item-value">{{ formattedFileSize(mySpaceInfo?.freeSpace * 1024 || 0) }}</span>
              </div>
            </div>
          </div>

          <div v-if="loading" class="loading-wrapper">
            <img src="../assets/loading_white.svg" alt="loading" class="loading-img" />
            <div class="loading-text">加载中...</div>
          </div>

          <div v-else class="material-grid">
            <div class="upload-card" @click="handleUploadCardClick">
              <div class="upload-icon">
                <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
              <div class="upload-text">上传素材</div>
              <div class="upload-desc">支持 FBX / OBJ / GLB</div>
            </div>
            <div v-for="item in list" :key="'material:' + item.id" class="material-card"
              :class="{ deleting: deletingId === item.id }">
              <div class="card-preview">
                <img v-if="item.previewImg" :src="item.previewImg" :alt="item.name" class="preview-img" />
                <img v-else src="../assets/Empty.png" alt="empty" class="preview-img placeholder" />
              </div>
              <div class="card-info">
                <div class="card-name">{{ item.name }}</div>
                <div class="card-fileSize">{{ item.fileSize / 1000 }}M</div>
                <div class="card-meta">
                  <button class="btn-public" @click.stop="handlePublish(item)">设置</button>
                  <span style="flex-grow: 1;"></span>
                  <button class="btn-delete" :disabled="deletingId === item.id" @click.stop="handleDelete(item)">
                    <svg v-if="deletingId === item.id" class="spin-icon" viewBox="0 0 24 24" fill="none" width="14"
                      height="14">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round"
                        stroke-dasharray="30 60" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>{{ deletingId === item.id ? '删除中' : '删除' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-info">
            共 {{ list.length }} 个素材
          </div>
          <button class="btn btn-close" @click="handleClose">关闭</button>
        </div>
      </div>
    </div>

    <ImportModelConfirm v-model:visible="showImportConfirm" :object="pendingImport.object" :file="pendingImport.file"
      :type="pendingImport.type" :scale-factor="pendingImport.scaleFactor" :position="pendingImport.position"
      :default-add-to-library="true" @confirm="handleImportConfirm" />

    <PublishModelModal v-if="publishItem && publishVisible" @close="publishVisible = false" :item="publishItem" @success="fetchList" />
    <input ref="fileInputRef" type="file" accept=".fbx,.obj,.glb" style="display: none;" @change="handleFileChange" />
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import * as THREE from 'three'
import service from '@/utils/request'
import importOutObj from '@/utils/importOutObj'
import ImportModelConfirm from './ImportModelConfirm.vue'
import PublishModelModal from './PublishModelModal.vue'

interface MaterialItem {
  id: string
  name: string
  fileSize: number
  type: number
  previewImg?: string
  file?: string
  initScale: number,
}
interface hunyuanItem {
  id: number,
  jobId: string,
  previewImage: string,
  name: string,
  status: number,
  zip: string,
  fileSize: number, // 单位时kb
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'refresh'): void
}>()

const list = ref<MaterialItem[]>([])
const loading = ref(false)
const deleting3DId = ref<number | null>(null)
const deletingId = ref<string | null>(null)

const mySpaceInfo = ref<{
  freeSpace: number,
  usedSpace: number,
  totalSize: number,
}>()

const spaceUsagePercent = computed(() => {
  if (!mySpaceInfo.value || !mySpaceInfo.value.totalSize) return 0
  const percent = (mySpaceInfo.value.usedSpace / mySpaceInfo.value.totalSize) * 100
  return Math.min(100, Math.max(0, Math.round(percent)))
})

function formattedFileSize(bytes: number) {
  if (bytes <= 0) return '0'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

// 文件上传相关
const fileInputRef = ref<HTMLInputElement | null>(null)
const showImportConfirm = ref(false)
// 公开模型浮层
const publishVisible = ref(false)
const publishItem = ref<MaterialItem | null>(null)

function handlePublish(item: MaterialItem) {
  publishItem.value = item
  publishVisible.value = true
}
const pendingImport = reactive<{
  object: THREE.Group | THREE.Mesh | null
  file: File | null
  type: string
  scaleFactor: number
  position: THREE.Vector3
}>({
  object: null,
  file: null,
  type: '',
  scaleFactor: 1,
  position: new THREE.Vector3(),
})

async function fetchList() {
  loading.value = true
  try {
    const [listRes, spaceRes] = await Promise.all([
      service.get('/video/materialLibrary/myList'),
      service.get('/video/materialLibrary/mySpace'),
    ])
    list.value = listRes.data || []
    mySpaceInfo.value = spaceRes.data
  } catch (error) {
    console.error('获取素材库列表失败:', error)
    list.value = []
  } finally {
    loading.value = false
  }
}

async function handleDelete(item: MaterialItem) {
  if (!confirm(`确定要删除「${item.name}」吗？`)) {
    return
  }
  deletingId.value = item.id
  try {
    await service.delete('/video/materialLibrary/delete/' + item.id)
    fetchList();
    emit('refresh')
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  } finally {
    deletingId.value = null
  }
}
async function handle3DDelete(item: hunyuanItem) {
  if (!confirm(`确定要删除「${item.name}」吗？`)) {
    return
  }
  deleting3DId.value = item.id
  try {
    const result = await service.delete('/video/hunyuan3D/delete/' + item.id)
    console.log('result---->', result)
    fetchList();
    emit('refresh')
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  } finally {
    deleting3DId.value = null
  }
}

function handleClose() {
  emit('update:visible', false)
}

// 点击上传素材卡片：唤起文件选择
function handleUploadCardClick() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

// 文件选择变化：调用 importOutObj 解析模型，然后打开确认弹窗
async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  await importOutObj(file, async (object, file, type, scaleFactor, position) => {
    pendingImport.object = object
    pendingImport.file = file
    pendingImport.type = type
    pendingImport.scaleFactor = scaleFactor
    pendingImport.position.copy(position)
    showImportConfirm.value = true
  })
}

// 导入确认完成后：刷新列表
function handleImportConfirm() {
  setTimeout(() => {
    fetchList()
    emit('refresh')
  }, 1000)
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      fetchList()
    }
  }
)
</script>

<style lang="less" scoped>
.material-library-modal {
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

  .material-library-modal-inner {
    background: white;
    border-radius: 8px;
    width: 880px;
    max-width: 90vw;
    max-height: 80vh;
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
        font-size: 18px;
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
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;

      .space-info {
        background: #fafbfc;
        border: 1px solid #eef0f3;
        border-radius: 10px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 16px;

        .space-info-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;

          .space-info-label {
            font-size: 13px;
            font-weight: 600;
            color: #444;
          }

          .space-progress-bar {
            height: 8px;
            background: #eef0f3;
            border-radius: 4px;
            overflow: hidden;
            flex-grow: 1;

            .space-progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #4096ff 0%, #1677ff 100%);
              border-radius: 4px;
              transition: width 0.4s ease;
            }
          }

          .space-info-percent {
            font-size: 13px;
            font-weight: 700;
            color: #1677ff;
            font-variant-numeric: tabular-nums;
          }
        }

        .space-info-items {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;

          .space-info-item {
            display: flex;
            align-items: center;
            gap: 5px;

            .item-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              flex-shrink: 0;
            }

            .item-label {
              font-size: 12px;
              color: #888;
            }

            .item-value {
              font-size: 12px;
              font-weight: 600;
              color: #333;
              font-variant-numeric: tabular-nums;
            }

            &.space-used .item-dot {
              background: #1677ff;
            }

            &.space-total .item-dot {
              background: #bfbfbf;
            }

            &.space-free .item-dot {
              background: #52c41a;
            }

            &.space-free .item-value {
              color: #389e0d;
            }
          }
        }
      }

      .loading-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 0;

        .loading-img {
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
        }

        .loading-text {
          margin-top: 12px;
          font-size: 14px;
          color: #666;
        }
      }

      .empty-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 0;

        .empty-img {
          width: 120px;
          height: 120px;
          opacity: 0.5;
        }

        .empty-text {
          margin-top: 16px;
          font-size: 14px;
          color: #999;
        }
      }

      .material-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;

        .upload-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          aspect-ratio: auto;
          min-height: 180px;
          border: 2px dashed #d9d9d9;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
          color: #999;
          padding: 16px;
          text-align: center;

          &:hover {
            border-color: #1890ff;
            background: #e6f7ff;
            color: #1890ff;
            transform: translateY(-2px);
            box-shadow: 0 2px 12px rgba(24, 144, 255, 0.12);
          }

          .upload-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }

          .upload-text {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 4px;
            color: inherit;
          }

          .upload-desc {
            font-size: 12px;
            opacity: 0.8;
          }
        }

        .material-card {
          display: flex;
          flex-direction: column;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          overflow: hidden;
          transition: all 0.2s;
          background: #fff;

          &:hover {
            border-color: #1890ff;
            box-shadow: 0 2px 12px rgba(24, 144, 255, 0.12);
            transform: translateY(-2px);
          }

          &.deleting {
            opacity: 0.5;
            pointer-events: none;
          }

          .card-preview {
            width: 100%;
            aspect-ratio: 1 / 1;
            background: #fafafa;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;

            .preview-img {
              width: 100%;
              height: 100%;
              object-fit: contain;

              &.placeholder {
                width: 50%;
                height: 50%;
                opacity: 0.25;
              }
            }
          }

          .card-info {
            padding: 10px 12px;
            display: flex;
            flex-direction: column;

            .card-name {
              font-size: 14px;
              font-weight: 500;
              color: #2c3e50;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              line-height: 1.4;
            }

            .card-fileSize {
              font-size: 12px;
              font-weight: 500;
              color: #2c3e50;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }

            .card-meta {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 4px;

              .btn-public {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                padding: 3px 8px;
                border: 1px solid #1890ff;
                background: white;
                color: #1890ff;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;

                &:hover:not(:disabled) {
                  background: #1890ff;
                  color: white;
                  border-color: #1890ff;
                }

                &:disabled {
                  cursor: not-allowed;
                  opacity: 0.7;
                }

                .spin-icon {
                  animation: spin 1s linear infinite;
                }
              }

              .btn-delete {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                padding: 3px 8px;
                border: 1px solid #ffccc7;
                background: white;
                color: #ff4d4f;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;

                &:hover:not(:disabled) {
                  background: #ff4d4f;
                  color: white;
                  border-color: #ff4d4f;
                }

                &:disabled {
                  cursor: not-allowed;
                  opacity: 0.7;
                }

                .spin-icon {
                  animation: spin 1s linear infinite;
                }
              }
            }
          }
        }
      }

      @media (max-width: 800px) {
        .material-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 600px) {
        .material-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-top: 1px solid #eaeaea;

      .footer-info {
        font-size: 13px;
        color: #888;
      }

      .btn {
        padding: 6px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      .btn-close {
        border: 1px solid #d9d9d9;
        background: white;
        color: #595959;

        &:hover {
          border-color: #1890ff;
          color: #1890ff;
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
