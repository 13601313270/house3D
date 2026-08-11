<template>
  <teleport to="#teleport">
    <div v-if="visible" class="material-library-modal" @click.self="handleClose">
      <div class="material-library-modal-inner">
        <div class="header">
          <div class="title">个人素材库管理</div>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="body">
          <div v-if="loading" class="loading-wrapper">
            <img src="../assets/loading_white.svg" alt="loading" class="loading-img" />
            <div class="loading-text">加载中...</div>
          </div>

          <div v-else-if="list.length === 0" class="empty-wrapper">
            <img src="../assets/Empty.png" alt="empty" class="empty-img" />
            <div class="empty-text">暂无素材</div>
          </div>

          <div v-else class="material-grid">
            <div v-for="item in list" :key="item.id" class="material-card"
              :class="{ deleting: deletingId === item.id }">
              <div class="card-preview">
                <img v-if="item.previewImg" :src="item.previewImg" :alt="item.name" class="preview-img" />
                <img v-else src="../assets/Empty.png" alt="empty" class="preview-img placeholder" />
              </div>
              <div class="card-info">
                <div class="card-name" :title="item.name">{{ item.name }}</div>
                <div class="card-meta">
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
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import service from '@/utils/request'

interface MaterialItem {
  id: string
  name: string
  type: number
  previewImg?: string
  file?: string
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
const deletingId = ref<string | null>(null)

async function fetchList() {
  loading.value = true
  try {
    const res = await service.get('/video/materialLibrary/myList')
    list.value = res.data || []
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
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  } finally {
    deletingId.value = null
  }
}

function handleClose() {
  emit('update:visible', false)
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
  z-index: 2000;

  .material-library-modal-inner {
    background: white;
    border-radius: 8px;
    width: 720px;
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
            gap: 8px;

            .card-name {
              font-size: 14px;
              font-weight: 500;
              color: #2c3e50;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              line-height: 1.4;
            }

            .card-meta {
              display: flex;
              align-items: center;
              justify-content: space-between;

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
