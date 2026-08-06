<template>
  <teleport to="#teleport">
    <div class="showGroupQrModal" @click.self="closeModal">
      <div class="showGroupQrModalInner">
        <div class="title">添加微信群领取金币</div>
        <div class="qrSection">
          <img src="/84142.jpg" class="qrImage" />
        </div>
        <div class="tipText">扫描上方二维码添加客服微信，领取20金币</div>
        <button class="closeButton" @click="closeModal">我知道了</button>
      </div>
    </div>
  </teleport>
</template>
<script setup lang="ts">

const emit = defineEmits<{
  (e: 'close'): void
}>()

const closeModal = () => {
  emit('close')
}
</script>
<style scoped lang="less">
.showGroupQrModal {
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

  .showGroupQrModalInner {
    width: 360px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    position: relative;
    margin-top: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }

    .qrSection {
      width: 280px;
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;

      .qrImage {
        width: 100%;
        height: auto;
        object-fit: contain;
        border-radius: 4px;
      }
    }

    .tipText {
      font-size: 14px;
      color: #666;
      text-align: center;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .closeButton {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
      color: white;
      font-size: 16px;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        opacity: 0.9;
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}
</style>
