<template>
  <div class="selectInfo" v-if="enums.find(v => v.id === modelValue)">
    <img class="img" :src="enums.find(v => v.id === modelValue)!.img" alt="" @click="showAllCornerTypePanel = true">
    <div class="desc">{{enums.find(v => v.id === modelValue)!.name}}</div>
  </div>
  <div class="selectInfo" v-else>
    <img class="img" src="../assets/Empty.png" alt="" @click="showAllCornerTypePanel = true">
    <div class="desc">请选择类型</div>
  </div>
  <teleport to="#teleport" v-if="showAllCornerTypePanel">
    <div class="cornerTypePanel" @click.self="showAllCornerTypePanel = false">
      <div class="cornerTypePanelInner">
        <div class="title">
          所有类型
        </div>
        <slot></slot>
        <div class="list">
          <div v-for="item in enums" :key="item.id" class="item" :class="{ active: modelValue === item.id }"
            @click="change(item.id)">
            <img class="img" :src="item.img" alt="">
            <div class="desc">{{ item.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { editItem, enumItem } from '@/entities';

const showAllCornerTypePanel = ref(false)

defineProps<{
  item: editItem,
  modelValue: any,
  enums: enumItem[]
}>()
const emit = defineEmits(['update:modelValue'])

function change(val: number | string) {
  emit('update:modelValue', val)
  showAllCornerTypePanel.value = false
}
</script>
<style scoped lang="less">
.selectInfo {
  display: flex;
  flex-direction: column;
  align-items: end;
  width: 88px;
  min-height: 20px;

  .img {
    width: 88px;
    min-height: 20px;
    border-radius: 4px;
    border: solid 1px #d9d9d9;
  }

  .desc {
    font-size: 14px;
    color: #666;
    text-align: center;
  }
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