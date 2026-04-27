<template>
  <div>
    <input v-if="item.dataType === 'number'" type="number" :value="modelValue[item.id]"
      @change="updateEditPropInputNumberInfo(item.id, $event)" :min="item.min" :max="item.max" :step="item.step"
      class="numberInput" />
    <input v-else-if="item.dataType === 'color'" type="color" class="colorInput" :value="modelValue[item.id]"
      @change="updateEditPropInputInfo(item.id, $event)" />
    <input v-else-if="item.dataType === 'boolean'" type="checkbox" :checked="modelValue[item.id]"
      @change="updateEditPropInputInfoBoolean(item.id, $event)" />
    <div v-else-if="item.dataType === 'material'" class="materialList">
      <div @click="allMaterialShow = true, allMaterialShowPropId = item.id">
        <div class="materialItem" v-if="!modelValue[item.id]">
          <div class="imgOuting">
            <img src="../assets/Empty.png" alt="noMaterial" class="img" style="width: 50px;background-color: white;" />
          </div>
          <div class="name">无</div>
        </div>
        <div v-for="item2 in allMaterial.filter(item2 => modelValue[item.id] === item2.id)" :key="item2.id"
          class="materialItem">
          <div class="imgOuting">
            <img :src="item2.img" alt="material" class="img" />
          </div>
          <div class="name">{{ item2.name }}</div>
        </div>
      </div>
    </div>
    <div class="allMaterialPanel" v-if="allMaterialShow && allMaterialShowPropId"
      @click.self="allMaterialShow = false, allMaterialShowPropId = undefined">
      <div class="allMaterialPanelInner">
        <div class="title">所有材质</div>
        <div class="list">
          <div class="materialItem"
            @click="updateEditPropInputNumberInfo(allMaterialShowPropId, 0), allMaterialShow = false">
            <div class="imgOuting">
              <img src="../assets/Empty.png" alt="noMaterial" class="img"
                style="width: 50px;background-color: white;" />
            </div>
            <div class="name">无</div>
          </div>
          <div v-for="item2 in allMaterial" :key="item2.id" class="materialItem"
            :class="{ active: modelValue[item2.id] === item2.id }"
            @click="updateEditPropInputNumberInfo(allMaterialShowPropId, item2.id), allMaterialShow = false">
            <div class="imgOuting">
              <img :src="item2.img" alt="material" class="img" />
            </div>
            <div class="name">{{ item2.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { editItem } from '@/entities';
import { allMaterial } from '@/material';
import { ref } from 'vue'

const props = defineProps({
  item: {
    type: Object as () => editItem,
    default: () => ({})
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const allMaterialShow = ref(false)
const allMaterialShowPropId = ref<string>()

const emit = defineEmits(['update:modelValue'])

function updateEditPropInputNumberInfo(id: string, event: Event | number) {
  if (event instanceof Event && id) {
    if (event.target !== null) {
      emit('update:modelValue', {
        ...props.modelValue,
        // @ts-ignore
        [id]: +(+event.target.value)
      })
    } else {
      emit('update:modelValue', {
        ...props.modelValue,
        [id]: null
      })
    }
  } else {
    emit('update:modelValue', {
      ...props.modelValue,
      [id]: event
    })
  }
}
function updateEditPropInputInfo(id: string, event: Event) {
  if (event.target) {
    emit('update:modelValue', {
      ...props.modelValue,
      // @ts-ignore
      [id]: event.target.value as string
    })
  }
}
function updateEditPropInputInfoBoolean(id: string, event: Event) {
  if (event.target) {
    emit('update:modelValue', {
      ...props.modelValue,
      // @ts-ignore
      [id]: event.target.checked
    })
  }
}

</script>
<style scoped lang="less">
.colorInput {
  width: 130px;
}

.numberInput {
  width: 100px;
}

.materialList {
  display: flex;
  flex-wrap: wrap;

  .materialItem {
    width: 50px;
    border: solid 1px black;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    border-radius: 4px;
    overflow: hidden;

    &:hover {
      transform: scale(2);
      transform-origin: right center;
      transition: all 0.1s;
    }

    &.active {
      border: solid 1px #1890ff;
      box-shadow: inset 0 0 0px 2px #1890ff;
    }

    .imgOuting {
      width: 48px;
      height: 48px;
      overflow: hidden;
      position: relative;
      z-index: -1;
      display: flex;
      align-items: center;
      justify-content: center;

      .img {
        width: 300px; // 稍微放大一点，不然50像素，看不清细节
      }
    }

    .name {
      z-index: -1;
      font-size: 14px;
      text-align: center;
      background-color: white;
    }
  }
}

.allMaterialPanel {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1001;
  background-color: #00000075;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .allMaterialPanelInner {
    display: flex;
    width: 610px;
    padding: 8px;
    min-height: 200px;
    max-height: 70vh;
    background-color: white;
    border-radius: 8px;
    overflow: auto;
    flex-direction: column;
    align-items: center;

    .title {
      font-size: 24px;
    }

    .list {
      width: 593px;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;

      .materialItem {
        flex-shrink: 0;
        border: solid 1px #b2b2b2;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        border-radius: 4px;
        overflow: hidden;

        &.active {
          border: solid 1px #1890ff;
          box-shadow: inset 0 0 0px 2px #1890ff;
        }

        .imgOuting {
          width: 140px;
          height: 140px;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;

          .img {
            width: 140px;
          }
        }

        .name {
          font-size: 14px;
          text-align: center;
          background-color: white;
        }
      }
    }
  }
}
</style>