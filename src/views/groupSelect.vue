<template>
  <div class="configItemList">
    <div class="configItem" v-for="item in allObjList" :key="item.id" @mouseenter="handleEnter(item)">
      <div class="nameInfo">
        <span>{{ item.name }}</span><span class="tip" v-if="item.tip">({{ item.tip }})</span>
      </div>
      <div class="tools">
        <div class="toolItem" @click="handleLocation(item)">
          <img class="img" src="@/assets/location.svg" alt="location" />
        </div>
        <div class="button" @click="handleSelect(item)">
          选择
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { PointEntityClass } from '@/types/pointEntity'
import { LineEntityClass } from '@/types/lineEntity'
import canvas2DSceneManage from '@/utils/canvas2DSceneManage'
import { GroupBaseEntity } from '@/types/groupBase/entity'

const allObjCount = ref(0)
type Item = {
  id: string,
  name: string,
  type: string,
  isHidden: boolean,
  isLocked: boolean,
  tip?: string,
}
const allObjList = ref<Array<Item>>([])
onMounted(() => {
  reloadObjList();
})
function reloadObjList() {
  allObjList.value = []
  window.worldApi.children.forEach(v => {
    const { id, isLocked, isHidden, tip } = v.getData()
    if (v instanceof GroupBaseEntity) {
      allObjList.value.push({
        id,
        name: v.getData().name,
        type: v.type,
        isHidden: isHidden || false,
        isLocked: isLocked || false,
        tip,
      })
    }
  })
  allObjCount.value = window.worldApi.getAllObjectCount()
}

const emit = defineEmits<{
  (e: 'close'): void,
  (e: 'select', id: string): void,
}>()

function handleEnter(item: {
  id: string,
  name: string,
  type: string,
  isLocked: boolean,
}) {
  const thisObj = window.worldApi.children.find(v => v.getData().id === item.id)
  if (thisObj) {
    const zoom2DLevel = canvas2DSceneManage.list[0].level;
    const worldData = window.worldApi.getData();
    const canvasAction = canvas2DSceneManage.list[0].canvasList[1];
    const ctxAction = canvasAction.getContext('2d')!
    const screenX = worldData.x * zoom2DLevel + canvas2DSceneManage.list[0].panOffset.x;
    const screenY = worldData.y * zoom2DLevel + canvas2DSceneManage.list[0].panOffset.y;
    ctxAction.clearRect(0, 0, canvasAction.width, canvasAction.height)
    ctxAction.save()
    ctxAction.translate(screenX, screenY)
    ctxAction.rotate(worldData.angleY * -1)
    thisObj.draw2DActionHandle(ctxAction, zoom2DLevel)
    ctxAction.restore()
  }
}
function handleLocationPosition(position: { x: number, y: number }) {
  console.log('position', position)
  const canvas = canvas2DSceneManage.list[0].canvasList[0]
  if (!canvas) return
  const canvasRect = canvas.getBoundingClientRect()
  const dx = canvasRect.width / 2
  const dy = canvasRect.height / 2
  canvas2DSceneManage.list[0].setPanOffset({
    x: dx - (position.x * canvas2DSceneManage.list[0].level),
    y: dy - (position.y * canvas2DSceneManage.list[0].level),
  })
}
function handleLocation(item: Item) {
  const api = window.worldApi.children.find(v => v.getData().id === item.id)
  if (!api) return

  if (api instanceof PointEntityClass) {
    const { x, y } = api.getData()
    handleLocationPosition({ x, y })
    nextTick(() => {
      handleEnter(item)
    })
  } else if (api instanceof LineEntityClass) {
    const points: Array<{ x: number, y: number }> = api.getData().points
    const centerX = points.reduce((acc, cur) => acc + cur.x, 0) / points.length
    const centerY = points.reduce((acc, cur) => acc + cur.y, 0) / points.length
    handleLocationPosition({ x: centerX, y: centerY })
    nextTick(() => {
      handleEnter(item)
    })
  }
}

function handleSelect(item: Item) {
  emit('select', item.id)
}

window.worldApi.onWorldChange(() => {
  reloadObjList()
})
</script>
<style scoped lang="less">
.configItemList {
  padding: 0 12px;
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

      .button {
        padding: 4px 8px;
        margin-left: 8px;
        border: none;
        border-radius: 4px;
        background: #e4e6eb;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s;
        flex-shrink: 0;
      }
    }
  }
}
</style>