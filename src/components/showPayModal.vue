<template>
  <teleport to="#teleport">
    <div class="showPayModal" @click.self="closeModal">
      <div class="showPayModalInner">
        <div class="title">
          充值
        </div>
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
.showPayModal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #00000075;
  border-radius: 10px;
  padding: 20px;
  z-index: 1000;

  .showPayModalInner {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 200px;
    padding: 20px;
    background: white;
    position: absolute;
    border-radius: 4px;

    .title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
    }
  }
}
</style>