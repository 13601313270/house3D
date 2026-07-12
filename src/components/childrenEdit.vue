<template>
  <div class="edit">
    <div class="configItemList" key="exist">
      <div v-for="item in modelValue" :key="item.data.id" class="configItem">
        <div class="nameInfo">
          <span>{{ allFileKeysName[item.type] }}</span><span class="tip" v-if="item.data.tip">({{ item.data.tip
            }})</span>
        </div>
        <div class="tools">
          <div class="toolItem">
            <!-- <img class="img lock" src="@/assets/lock.svg" alt="lock" /> -->
          </div>
        </div>
      </div>
    </div>
    <div>======</div>
    <!-- {{ modelValue }} -->
    <div class="configItemList" key="notExist">
      <div v-for="item in allChild" :key="item.id" class="configItem">
        <div class="nameInfo">
          <span>{{ item.name }}</span><span class="tip" v-if="item.tip">({{ item.tip }})</span>
        </div>
        <div class="tools">
          <div class="toolItem" @click="joinGroup(item)">
            <img class="img lock" src="@/assets/lock.svg" alt="lock" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { allFileKeysName, editItem } from '@/entities';
import { BaseObjData } from '@/types/map2d';

const props = defineProps<{
  item: editItem,
  modelValue: Array<{
    type: string,
    data: BaseObjData,
  }>,
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: Array<{
    type: string,
    data: BaseObjData,
  }>): void
}>()
type Item = {
  id: string,
  name: string,
  type: string,
  isHidden: boolean,
  isLocked: boolean,
  tip?: string,
}
const allChild = ref<Item[]>([])
onMounted(() => {
  let newCount = 0;
  allChild.value = []
  for (const key of window.worldApi.getAllObjectTypes()) {
    if (window.worldApi.getTypeListEntity(key)) {
      newCount += window.worldApi.getTypeListEntity(key).length
      allChild.value.push(...window.worldApi.getTypeListEntity(key)
        .filter(v => {
          return v.type !== 'pointGroup'
        })
        .map((item) => {
          const { id, isLocked, isHidden, tip } = item.getData()
          return {
            id,
            name: item.name,
            type: item.type,
            isHidden: isHidden || false,
            isLocked: isLocked || false,
            tip,
          }
        }))
    }
  }
  // allChild.value = props.item.children
})
function joinGroup(item: Item) {
  const newList: Array<{
    type: string,
    data: BaseObjData,
  }> = [...props.modelValue];
  const oldIds = props.modelValue.map(v => v.data.id)
  if (oldIds.includes(item.id)) {
    return
  }
  console.log(item)
  const newItem = { ...item };
  const type = item.type
  newList.push({
    type,
    data: newItem,
  })
  emit('update:modelValue', newList)
}
</script>
<style scoped lang="less">
.edit {
  width: 316px;
}

.configItemList {
  overflow-y: auto;
  flex-grow: 1;

  .configItem {
    display: flex;
    align-items: center;
    border-bottom: solid 1px #e9e9e9;
    padding: 4px 0;

    &:last-child {
      border-bottom: none;
    }

    .nameInfo {
      flex-grow: 1;

      .tip {
        color: #8a8a8a;
      }
    }

    .tools {
      display: flex;
      align-items: center;

      .toolItem {
        // border: 1px solid #8a8a8a;
        // border-radius: 4px;
        padding: 1px;
        // margin-left: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        box-sizing: border-box;

        .img {
          width: 24px;
          height: 24px;

          &.lock {
            width: 20px;
            height: 20px;
            margin-top: -2px;
          }
        }
      }
    }
  }
}
</style>