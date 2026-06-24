<template>
  <div v-if="item.dataType === 'angle'" class="numberEdit">
    <!-- <input type="range" :value="modelValue" @input="updateEditPropInputNumberInfo"
      :min="item.min === -Infinity ? -500 : item.min" :max="item.max === Infinity ? 500 : item.max" :step="item.step"
      class="numberInputRange" /> -->
    <div class="angleStr">弧度：{{ modelValue.toFixed(2) || '' }}</div>
    <div class="angleNumberTitle">角度：</div>
    <div class="numberInputContainer">
      <input type="number" :value="inputNumber" :min="item.min" :max="item.max" @change="updateEditPropInputNumberInfo" :step="1"
        class="numberInput" />
      <div class="unit">°</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { editItem } from '@/entities';
import { compute } from 'three/src/nodes/gpgpu/ComputeNode';
import { computed } from 'vue';
const props = defineProps<{
  item: editItem,
  modelValue: number,
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()
const inputNumber = computed<number>(() => {
  if (props.item.dataType === 'angle') {
    const { min, max } = props.item
    const valueCalc = +(props.modelValue / Math.PI * 180).toFixed(0);
    return Math.max(Math.min(valueCalc, max), min)
  } else {
    return 0;
  }
})
function updateEditPropInputNumberInfo(event: Event | number) {
  if (event instanceof Event) {
    if (event.target !== null) {
      // @ts-ignore
      update(+(+event.target.value))
    } else {
      emit('update:modelValue', null)
    }
  } else {
    update(event)
  }
}
function update(inputNumber: number) {
  if (props.item.dataType === 'angle') {
    const { min, max } = props.item
    console.log('inputNumber', inputNumber)
    const inputNumber_ = Math.max(Math.min(inputNumber, max), min)
    // 角度转弧度
    let angle = inputNumber_ * Math.PI / 180
    // 限制在0-2pi之间
    angle %= 2 * Math.PI

    emit('update:modelValue', angle)
  }
}
</script>
<style scoped lang="less">
.numberEdit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  .angleStr {
    color: #666666;
    font-size: 14px;
    margin-right: 16px;
  }

  .angleNumberTitle {
    color: #3b3b3b;
    font-size: 14px;
    margin-right: 2px;
  }

  .numberInputRange {
    flex-grow: 1;
    margin-right: 8px;
  }

  .numberInputContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    border: solid 1px #b2b2b2;
    border-radius: 4px;
    overflow: hidden;

    .numberInput {
      margin-left: 2px;
      width: 32px;
      height: 28px;
      border: none;
      outline: none;
      -moz-appearance: textfield;
    }

    .numberInput::-webkit-inner-spin-button,
    .numberInput::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .numberInput:focus {
      outline: none;
      box-shadow: none;
    }

    .unit {
      margin-right: 2px;
      color: #b2b2b2;
    }
  }
}
</style>