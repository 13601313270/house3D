<template>
  <img class="img" v-if="modelValue === 1" src="cornerTypeImgs/1.png" alt="" @click="showAllCornerTypePanel = true">
  <img class="img" v-if="modelValue === 2" src="cornerTypeImgs/2.png" alt="" @click="showAllCornerTypePanel = true">
  <img class="img" v-if="modelValue === 3" src="cornerTypeImgs/3.png" alt="" @click="showAllCornerTypePanel = true">
  <img class="img" v-if="modelValue === 4" src="cornerTypeImgs/4.png" alt="" @click="showAllCornerTypePanel = true">
  <img class="img" v-if="modelValue === 5" src="cornerTypeImgs/5.png" alt="" @click="showAllCornerTypePanel = true">
  <teleport to="#teleport" v-if="showAllCornerTypePanel">
    <div class="cornerTypePanel" @click.self="showAllCornerTypePanel = false">
      <div class="cornerTypePanelInner">
        <div class="title">
          所有角点类型
        </div>
        <slot></slot>
        <div class="list">
          <div class="item" :class="{ active: modelValue === 1 }" @click="change(1)">
            <img class="img" src="cornerTypeImgs/1.png" alt="">
            <div class="desc">对角，无独立墙蹲</div>
          </div>
          <div class="item" :class="{ active: modelValue === 2 }" @click="change(2)">
            <img class="img" src="cornerTypeImgs/2.png" alt="">
            <div class="desc">切脚，独立墙蹲</div>
          </div>
          <div class="item" :class="{ active: modelValue === 3 }" @click="change(3)">
            <img class="img" src="cornerTypeImgs/3.png" alt="">
            <div class="desc">对角，独立墙蹲</div>
          </div>
          <div class="item" :class="{ active: modelValue === 4 }" @click="change(4)">
            <img class="img" src="cornerTypeImgs/4.png" alt="">
            <div class="desc">对角，独立墙蹲</div>
          </div>
          <div class="item" :class="{ active: modelValue === 5 }" @click="change(5)">
            <img class="img" src="cornerTypeImgs/5.png" alt="">
            <div class="desc">圆角，独立墙蹲</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { editItem } from '@/entities';

const showAllCornerTypePanel = ref(false)

defineProps<{
  item: editItem,
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])

function change(val: number) {
  emit('update:modelValue', val)
  showAllCornerTypePanel.value = false
}
</script>
<style scoped lang="less">
.img {
  height: 88px;
  border-radius: 4px;
  border: solid 1px #d9d9d9;
}

.cornerTypePanel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #0000004a;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  .cornerTypePanelInner {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    .title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      text-align: center;
      margin-bottom: 20px;
    }

    .list {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 8px;
      gap: 8px;

      .item {
        border: solid 2px #d9d9d9;
        border-radius: 4px;
        padding: 10px;

        &.active {
          border-color: #66b1ff;
          box-shadow: inset 0 0 6px #66b1ff;
        }

        .img {
          width: 200px;
          height: 200px;
        }

        .desc {
          font-size: 16px;
          color: #666;
          text-align: center;
        }
      }
    }
  }
}
</style>