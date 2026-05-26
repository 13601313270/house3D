<template>
  <div class="help-modal" @click.self="emits('close')">
    <div class="help-modal-content">
      <div class="help-modal-header">
        <span>帮助</span>
        <button class="close-btn" @click="emits('close')">×</button>
      </div>
      <div class="help-modal-body">
        <div class="help-item">
          <label>微信号：</label>
          <span class="value">{{ wechatNumber }}</span>
          <button class="btn" @click="copyWechat">复制</button>
        </div>
        <div class="help-item">
          <label>邮箱：</label>
          <span class="value">{{ emailAddress }}</span>
          <button class="btn" @click="sendEmail">发送邮件</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'

const wechatNumber = 'w309568486'
const emailAddress = '309568486@qq.com'
const emits = defineEmits(['close'])

const copyWechat = async () => {
  try {
    await navigator.clipboard.writeText(wechatNumber)
    alert('微信号已复制')
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const sendEmail = () => {
  window.location.href = `mailto:${emailAddress}`
}
</script>
<style scoped lang="less">
/* 帮助弹窗样式 */
.help-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .help-modal-content {
    background: white;
    border-radius: 8px;
    width: 360px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    .help-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #d9d9d9;
      font-size: 18px;
      font-weight: bold;

      .close-btn {
        background: transparent;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 24px;
        height: 24px;
        line-height: 24px;
        text-align: center;

        &:hover {
          color: #666;
        }
      }
    }

    .help-modal-body {
      padding: 16px;

      .help-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        label {
          width: 80px;
          font-weight: bold;
          text-align: left;
        }

        .value {
          flex: 1;
          font-family: monospace;
          color: #1890ff;
          text-align: left;
        }

        .btn {
          padding: 4px 12px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          background: #1890ff;
          color: white;

          &:hover {
            background: #40a9ff;
          }
        }
      }
    }
  }
}
</style>