<template>
  <teleport to="#teleport">
    <div class="ground-texture-editor">
      <div class="toolbar">
        <div class="element-library">
          <button v-for="item in spriteLibrary" :key="item.id" class="element-btn" :class="{
            active: textureWorld.selectedSprite?.id === item.id,
            'sprite-type': item.type === 'sprite',
            'line-type': item.type === 'polyline',
            'polygon-type': item.type === 'polygon'
          }" @click="selectSprite(item)" :title="item.name">
            <span>{{ item.icon }}</span>
            <span class="element-name">{{ item.name }}</span>
          </button>
        </div>
      </div>

      <div class="canvas-container" ref="canvasWrapperRef">
        <div class="canvas-wrapper">
          <canvas ref="gridCanvasRef" class="grid-canvas"></canvas>
          <canvas ref="canvasRef" class="main-canvas" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
            @mouseup="handleMouseUp" @mouseleave="handleMouseUp" @wheel="handleWheel"></canvas>
          <canvas ref="previewCanvasRef" class="preview-canvas"></canvas>

          <div
            v-if="textureWorld.isDrawing && (textureWorld.currentTool === 'polyline' || textureWorld.currentTool === 'polygon')"
            class="hint">
            {{ textureWorld.currentTool === 'polygon' ? '点击画布添加顶点，双击完成绘制（至少3点），按Esc取消' : '点击画布添加点，双击完成绘制（至少2点），按Esc取消'
            }}
          </div>
        </div>
      </div>

      <div v-if="selectedElement" class="properties-panel"
        :style="{ left: panelPosition.x + 'px', top: panelPosition.y + 'px' }">
        <div class="panel-header" @mousedown="startPanelDrag">
          <span class="drag-handle">
            <img src="@/assets/move2.svg" alt="move" @mousedown.prevent />
          </span>
          <div class="title">属性</div>
          <div class="close-btn"></div>
        </div>
        <div class="panel-content">
          <div class="property-list">
            <div class="property-item" v-for="item in editParams" :key="item.id">
              <label>{{ item.label }}</label>
              <div v-if="item.dataType === 'string'" class="textContainer">
                <input type="text" class="textInput" v-model="item.value" @input="render" />
              </div>
              <div v-else-if="item.dataType === 'number'" class="numberEdit">
                <input type="range" v-model.number="item.value" :min="item.min" :max="item.max" :step="item.step"
                  @input="render" />
                <div class="numberInputContainer">
                  <input type="number" class="numberInput" v-model.number="item.value" :min="item.min" :max="item.max"
                    :step="item.step" @input="render" />
                  <div v-if="item.unit" class="unit">{{ item.unit }}</div>
                </div>
              </div>
              <div v-else-if="item.dataType === 'color'" class="colorEdit">
                <input type="color" v-model="item.value" @input="render" />
              </div>
              <span v-else-if="item.dataType === 'boolean'">{{ item.value ? '是' : '否' }}</span>
            </div>
          </div>
          <div class="bottomTools">
            <div class="layer-controls">
              <button class="layer-btn" @click="bringForward" title="上移一层">⬆️ 上移</button>
              <button class="layer-btn" @click="sendBackward" title="下移一层">⬇️ 下移</button>
            </div>
            <button class="delete-btn" @click="deleteElement">删除元素</button>
          </div>
        </div>
      </div>

      <div class="actions">
        <div class="background-color-picker">
          <label>背景</label>
          <input type="color" v-model="backgroundColor" @input="updateBackgroundColor" />
        </div>
        <button class="action-btn" @click="saveData">保存</button>
        <button class="action-btn" @click="clearCanvas">清空</button>
        <button class="action-btn" @click="emit('close')">返回</button>
        <!-- <div class="panel-close-btn" @click="emit('close')">
        <img src="@/assets/close.svg" alt="close" />
      </div> -->
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { TextureWorld } from './textureWorld'
import { CanvasRenderer } from './renderer'
import type { BaseElement, BaseElementData, BaseElementDefinition } from './types'
import { SpriteElement, SpriteElementData } from './types/spriteElement'
import { editItem } from '@/entities'
import { PolylineElement, PolylineElementData } from './types/polylineElement'
import { PolygonElement } from './types/polygonElement'
import { IconDataType } from './types/elementDefinition'

const props = defineProps<{
  width?: number
  height?: number
  shape?: 'rect' | 'circle'
  modelValue: {
    value: any[]
    viewImg: string
    backgroundColor: string
  }
  dataTypeList: IconDataType[]
}>()

const emit = defineEmits<{
  (e: 'close'): void,
  (e: 'update:modelValue', value: {
    value: BaseElement<BaseElementData>[],
    viewImg: string,
    backgroundColor: string
  }): void,
}>()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const gridCanvasRef = ref<HTMLCanvasElement | null>(null)
const previewCanvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapperRef = ref<HTMLDivElement | null>(null)

const textureWorld = new TextureWorld()
let renderer: CanvasRenderer | null = null
let resizeObserver: ResizeObserver | null = null

const mousePos = ref({ x: 0, y: 0 })
const selectedElementId = ref<string | null>(null)
const editParams = ref<editItem[]>([])
const panelPosition = ref({ x: window.innerWidth - 360, y: 20 })
const isDraggingPanel = ref(false)
const panelDragOffset = ref({ x: 0, y: 0 })
const isResizing = ref(false)
const backgroundColor = ref('#ffffff')
const resizeCorner = ref<'tl' | 'br' | null>(null)
const isDraggingPoint = ref(false)
const draggingPointIndex = ref(-1)
const dragPointOffset = ref({ x: 0, y: 0 })
const resizeOffset = ref({ x: 0, y: 0 })

const selectedElement = computed<BaseElement<any> | null>(() => {
  if (!selectedElementId.value) return null
  return textureWorld.getElementById(selectedElementId.value) || null
})

function updateBackgroundColor() {
  textureWorld.backgroundColor = backgroundColor.value
  render()
}

async function selectSprite(item: BaseElementDefinition) {
  // 如果正在绘制，先取消（无论 drawingElement 是否存在）
  if (textureWorld.isDrawing) {
    textureWorld.cancelDrawing()
  }
  textureWorld.setTool(item.type)
  await textureWorld.setSelectedSprite(item)
}

function getCanvasPos(e: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

async function handleMouseDown(e: MouseEvent) {
  const pos = getCanvasPos(e)
  mousePos.value = pos

  const now = Date.now()
  const isDoubleClick = now - textureWorld.lastClickTime < 300
  textureWorld.lastClickTime = now

  const worldPos = {
    x: Math.round((pos.x - textureWorld.canvasOffset.x) / textureWorld.scale),
    y: Math.round((pos.y - textureWorld.canvasOffset.y) / textureWorld.scale),
  }

  // 正在绘制：处理绘制逻辑
  if (textureWorld.isDrawing) {
    if (textureWorld.currentTool === 'sprite' && textureWorld.drawingElement) {
      const sprite = textureWorld.drawingElement as SpriteElement<SpriteElementData>
      sprite.data.x = worldPos.x
      sprite.data.y = worldPos.y
      const elementId = sprite.data.id
      textureWorld.finishDrawing()
      selectedElementId.value = elementId
      editParams.value = JSON.parse(JSON.stringify(sprite.setEditParams()))
      renderer?.renderPreview(textureWorld, pos)
      render()
      return
    }

    if (textureWorld.currentTool === 'polyline' || textureWorld.currentTool === 'polygon') {
      if (isDoubleClick) {
        const minPoints = textureWorld.currentTool === 'polygon' ? 3 : 2
        const drawing = textureWorld.drawingElement as PolylineElement<PolylineElementData>
        if (drawing && drawing.data.points.length >= minPoints) {
          const elementId = drawing.data.id
          textureWorld.finishDrawing()
          selectedElementId.value = elementId
          render()
          return
        }
      }
      textureWorld.addDrawingPoint(worldPos)
      return
    }
  }

  // 未在绘制：处理选择/拖拽/平移逻辑
  selectElementAt(worldPos, pos)
  render()
}

// 统一的元素选择逻辑
function selectElementAt(worldPos: { x: number; y: number }, screenPos: { x: number; y: number }) {
  // 0. 检测当前选中 Sprite 的缩放控制点（控制点可能超出元素边界）
  const selectedEl = textureWorld.getSelectedElement()
  if (selectedEl && selectedEl instanceof SpriteElement && selectedEl.data.id === selectedElementId.value) {
    const hitCorner = selectedEl.hitTestResizeHandle(worldPos)
    if (hitCorner) {
      isResizing.value = true
      resizeCorner.value = hitCorner
      textureWorld.isDragging = false
      textureWorld.isPanning = false

      const sprite = selectedEl as SpriteElement<SpriteElementData>
      const { x, y, width, height } = sprite.data
      const cornerPos = hitCorner === 'tl'
        ? { x: x - width / 2, y: y - height / 2 }
        : { x: x + width / 2, y: y + height / 2 }
      resizeOffset.value = {
        x: worldPos.x - cornerPos.x,
        y: worldPos.y - cornerPos.y,
      }
      return
    }
  }

  // 1. 检测 Polyline/Polygon 的顶点
  for (const el of textureWorld.elements) {
    if (el instanceof PolylineElement || el instanceof PolygonElement) {
      const pointIndex = (el as PolylineElement<PolylineElementData>).hitTestPoint(worldPos)
      if (pointIndex !== -1) {
        const isAlreadySelected = el.data.id === selectedElementId.value
        selectAndEdit(el)
        if (isAlreadySelected) {
          startDragPoint(el as PolylineElement<PolylineElementData>, pointIndex, worldPos)
        }
        return
      }
    }
  }

  // 2. 检测其他元素
  const element = textureWorld.findElementAt(worldPos)
  if (!element) {
    // 空白区域：取消选择，开始平移
    textureWorld.selectElement(null)
    selectedElementId.value = null
    editParams.value = []
    textureWorld.isDragging = false
    textureWorld.isPanning = true
    textureWorld.panStartPos = screenPos
    textureWorld.panStartOffset = { ...textureWorld.canvasOffset }
    return
  }

  // 3. 检测元素
  selectAndEdit(element)

  // 4. 根据元素类型设置拖拽模式
  if (element instanceof PolylineElement) {
    textureWorld.isDragging = false
    textureWorld.isPanning = true
    textureWorld.panStartPos = screenPos
    textureWorld.panStartOffset = { ...textureWorld.canvasOffset }
  } else if (element instanceof PolygonElement) {
    const polygon = element
    if (polygon.hitTestDragHandle(worldPos)) {
      textureWorld.isDragging = true
      textureWorld.isPanning = false
      const center = polygon.getCenter()
      textureWorld.dragOffset = {
        x: worldPos.x - center.x,
        y: worldPos.y - center.y,
      }
    } else {
      textureWorld.isDragging = false
      textureWorld.isPanning = true
      textureWorld.panStartPos = screenPos
      textureWorld.panStartOffset = { ...textureWorld.canvasOffset }
    }
  } else {
    // Sprite 或其他元素
    textureWorld.isDragging = true
    textureWorld.isPanning = false
    const elementPos = 'x' in element.data
      ? { x: (element as SpriteElement<SpriteElementData>).data.x, y: (element as SpriteElement<SpriteElementData>).data.y }
      : (element as PolylineElement<PolylineElementData>).data.points[0]
    textureWorld.dragOffset = {
      x: worldPos.x - elementPos.x,
      y: worldPos.y - elementPos.y,
    }
  }
}

function selectAndEdit(element: BaseElement<BaseElementData>) {
  textureWorld.selectElement(element.data.id)
  selectedElementId.value = element.data.id
  editParams.value = JSON.parse(JSON.stringify(element.setEditParams()))
}

function startDragPoint(element: PolylineElement<PolylineElementData>, pointIndex: number, worldPos: { x: number; y: number }) {
  isDraggingPoint.value = true
  draggingPointIndex.value = pointIndex
  const pointPos = element.data.points[pointIndex]
  dragPointOffset.value = {
    x: worldPos.x - pointPos.x,
    y: worldPos.y - pointPos.y,
  }
  textureWorld.isDragging = false
  textureWorld.isPanning = false
}

function handleMouseMove(e: MouseEvent) {
  const pos = getCanvasPos(e)
  mousePos.value = pos

  if (textureWorld.isPanning) {
    textureWorld.updatePanOffset({
      x: textureWorld.panStartOffset.x + (pos.x - textureWorld.panStartPos.x),
      y: textureWorld.panStartOffset.y + (pos.y - textureWorld.panStartPos.y),
    })
    render()
    return
  }

  if (renderer) {
    renderer.renderPreview(textureWorld, pos)
  }

  if (isResizing.value) {
    const worldPos = {
      x: Math.round((pos.x - textureWorld.canvasOffset.x) / textureWorld.scale),
      y: Math.round((pos.y - textureWorld.canvasOffset.y) / textureWorld.scale),
    }
    const element = textureWorld.getSelectedElement()
    if (element && element instanceof SpriteElement) {
      const sprite = element as SpriteElement<SpriteElementData>
      const { x, y, width, height } = sprite.data

      const cornerX = worldPos.x - resizeOffset.value.x
      const cornerY = worldPos.y - resizeOffset.value.y

      if (resizeCorner.value === 'br') {
        const newWidth = Math.round(Math.max(20, cornerX - (x - width / 2)))
        const newHeight = Math.round(Math.max(20, cornerY - (y - height / 2)))
        sprite.data.width = newWidth
        sprite.data.height = newHeight
      } else if (resizeCorner.value === 'tl') {
        const newWidth = Math.round(Math.max(20, (x + width / 2) - cornerX))
        const newHeight = Math.round(Math.max(20, (y + height / 2) - cornerY))
        sprite.data.x = Math.round(x + (width - newWidth) / 2)
        sprite.data.y = Math.round(y + (height - newHeight) / 2)
        sprite.data.width = newWidth
        sprite.data.height = newHeight
      }
    }
    render()
    return
  }

  if (isDraggingPoint.value) {
    const worldPos = {
      x: Math.round((pos.x - textureWorld.canvasOffset.x) / textureWorld.scale),
      y: Math.round((pos.y - textureWorld.canvasOffset.y) / textureWorld.scale),
    }
    const element = textureWorld.getSelectedElement()
    if (element && element instanceof PolylineElement) {
      const polyline = element as PolylineElement<PolylineElementData>
      const newPos = {
        x: worldPos.x - dragPointOffset.value.x,
        y: worldPos.y - dragPointOffset.value.y,
      }
      polyline.movePoint(draggingPointIndex.value, newPos)
    } else if (element && element instanceof PolygonElement) {
      const polygon = element as PolygonElement<any>
      const newPos = {
        x: worldPos.x - dragPointOffset.value.x,
        y: worldPos.y - dragPointOffset.value.y,
      }
      polygon.movePoint(draggingPointIndex.value, newPos)
    }
    render()
    return
  }

  if (textureWorld.isDragging) {
    const worldPos = {
      x: Math.round((pos.x - textureWorld.canvasOffset.x) / textureWorld.scale),
      y: Math.round((pos.y - textureWorld.canvasOffset.y) / textureWorld.scale),
    }
    const element = textureWorld.getSelectedElement()
    if (element) {
      if (element instanceof PolygonElement) {
        const polygon = element as PolygonElement<any>
        const center = polygon.getCenter()
        const dx = worldPos.x - textureWorld.dragOffset.x - center.x
        const dy = worldPos.y - textureWorld.dragOffset.y - center.y
        textureWorld.translateSelectedElement(dx, dy)
      } else {
        const oldPos = element instanceof SpriteElement
          ? { x: (element as SpriteElement<SpriteElementData>).data.x, y: (element as SpriteElement<SpriteElementData>).data.y }
          : (element as any).data.points[0]
        const newX = worldPos.x - textureWorld.dragOffset.x
        const dx = newX - oldPos.x
        const dy = (worldPos.y - textureWorld.dragOffset.y) - oldPos.y
        textureWorld.translateSelectedElement(dx, dy)
      }
    }
    render()
    return
  }

  if (textureWorld.isDrawing) {
    render()
  }
}

function handleMouseUp(_e: MouseEvent) {
  textureWorld.isDragging = false
  textureWorld.isPanning = false
  isResizing.value = false
  resizeCorner.value = null
  isDraggingPoint.value = false
  draggingPointIndex.value = -1
  dragPointOffset.value = { x: 0, y: 0 }
  render()
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()

  const pos = getCanvasPos(e as unknown as MouseEvent)

  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.1, Math.min(5, textureWorld.scale * zoomFactor))

  const worldX = (pos.x - textureWorld.canvasOffset.x) / textureWorld.scale
  const worldY = (pos.y - textureWorld.canvasOffset.y) / textureWorld.scale

  textureWorld.canvasOffset.x = pos.x - worldX * newScale
  textureWorld.canvasOffset.y = pos.y - worldY * newScale
  textureWorld.scale = newScale

  render()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (textureWorld.drawingElement instanceof SpriteElement) {
      textureWorld.setTool('select')
      textureWorld.cancelDrawing()
      return;
    }
    if (textureWorld.isDrawing) {
      const minPoints = textureWorld.currentTool === 'polygon' ? 3 : 2
      if (textureWorld.drawingElement &&
        (textureWorld.drawingElement as any).data.points.length >= minPoints) {
        textureWorld.finishDrawing()
        textureWorld.setTool('select')
      } else {
        textureWorld.cancelDrawing()
      }
      render()
    }
  }
}

function render() {
  renderer?.render(textureWorld, mousePos.value)
}

function resizeCanvas() {
  if (!canvasWrapperRef.value || !renderer) return

  const wrapperWidth = canvasWrapperRef.value.clientWidth
  const wrapperHeight = canvasWrapperRef.value.clientHeight

  const newWidth = wrapperWidth;
  const newHeight = wrapperHeight;

  const oldWidth = renderer.width
  const oldHeight = renderer.height

  renderer.resize(newWidth - 1, newHeight - 1)

  const offsetRatioX = newWidth / oldWidth
  const offsetRatioY = newHeight / oldHeight

  textureWorld.canvasOffset = {
    x: textureWorld.canvasOffset.x * offsetRatioX,
    y: textureWorld.canvasOffset.y * offsetRatioY,
  }

  render()
}

function saveData() {
  const data = textureWorld.exportElements()
  if (renderer) {
    const viewImg = renderer.exportFullImage(textureWorld)
    emit('update:modelValue', { value: data.elements, viewImg, backgroundColor: data.backgroundColor })
  }
}

function clearCanvas() {
  if (!canvasWrapperRef.value) return
  const initialWidth = canvasWrapperRef.value.clientWidth
  const initialHeight = canvasWrapperRef.value.clientHeight
  textureWorld.clear()
  textureWorld.canvasOffset = {
    x: initialWidth / 2,
    y: initialHeight / 2,
  }
  selectedElementId.value = null
  render()
}

function bringForward() {
  textureWorld.bringForward()
  render()
}

function sendBackward() {
  textureWorld.sendBackward()
  render()
}

function deleteElement() {
  const element = textureWorld.getSelectedElement()
  if (element) {
    textureWorld.removeElement(element)
    selectedElementId.value = null
    render()
  }
}

function startPanelDrag(e: MouseEvent) {
  isDraggingPanel.value = true
  panelDragOffset.value = {
    x: e.clientX - panelPosition.value.x,
    y: e.clientY - panelPosition.value.y,
  }
  document.addEventListener('mousemove', handlePanelDrag)
  document.addEventListener('mouseup', stopPanelDrag)
}

function handlePanelDrag(e: MouseEvent) {
  if (!isDraggingPanel.value) return

  const newX = e.clientX - panelDragOffset.value.x
  const newY = e.clientY - panelDragOffset.value.y

  panelPosition.value = {
    x: Math.max(0, Math.min(window.innerWidth - 200, newX)),
    y: Math.max(0, Math.min(window.innerHeight - 400, newY)),
  }
}

function stopPanelDrag() {
  isDraggingPanel.value = false
  document.removeEventListener('mousemove', handlePanelDrag)
  document.removeEventListener('mouseup', stopPanelDrag)
}

watch(
  () => textureWorld.selectedElementId,
  () => {
    render()
  }
)

watch(
  () => textureWorld.elements.length,
  () => {
    render()
  }
)

onMounted(async () => {
  if (!canvasWrapperRef.value) return
  const initialWidth = canvasWrapperRef.value.clientWidth
  const initialHeight = canvasWrapperRef.value.clientHeight
  textureWorld.canvasOffset = {
    x: initialWidth / 2,
    y: initialHeight / 2,
  }

  if (canvasRef.value && gridCanvasRef.value && previewCanvasRef.value) {
    renderer = new CanvasRenderer(
      canvasRef.value,
      gridCanvasRef.value,
      previewCanvasRef.value,
      initialWidth,
      initialHeight,
      props.width,
      props.height
    )

    textureWorld.backgroundColor = props.modelValue.backgroundColor || '#fff'

    if (props.modelValue && props.modelValue.value) {
      await textureWorld.importElements(props.modelValue.value)
    }
    backgroundColor.value = textureWorld.backgroundColor

    render()
  }

  if (canvasWrapperRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })
    resizeObserver.observe(canvasWrapperRef.value)
  }

  window.addEventListener('keydown', handleKeyDown)
})

const spriteLibrary = computed(() => {
  return textureWorld.spriteLibrary.filter((item) => props.dataTypeList.includes(item.dataType))
})

watch(() => editParams.value, (newVal) => {
  const element = textureWorld.getSelectedElement()
  if (element) {
    newVal.forEach((item) => {
      if (item.dataType === 'title') return
      // @ts-ignore
      element.data[item.id] = item.value
    })
    render()
  }
}, {
  deep: true
})

onUnmounted(() => {
  renderer = null
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped lang="less">
.ground-texture-editor {
  display: flex;
  flex-direction: row;
  height: 100vh;
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  background: #f0f2f5;
  gap: 24px;

  .element-library {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 4px;

    .element-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 62px;
      height: 62px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;

      .element-name {
        font-size: 12px;
        color: #666;
        margin-top: 2px;
      }
    }

    .element-btn:hover {
      border-color: #1890ff;
    }

    .element-btn.active {
      background: #e6f7ff;
      border-color: #1890ff;
    }
  }
}

.actions {
  display: flex;
  flex-direction: row;
  gap: 8px;
  margin-left: auto;
  position: fixed;
  z-index: 1000;
  background: #ffffffba;
  left: 50%;
  top: 8px;
  border-radius: 8px;
  transform: translateX(-50%);
  padding: 8px;

  .background-color-picker {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;

    label {
      font-size: 12px;
      color: #666;
    }

    input[type='color'] {
      width: 48px;
      height: 32px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      cursor: pointer;
      padding: 0;
    }
  }
}

.file-input {
  display: none;
}

.action-btn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.action-btn.primary {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.action-btn.primary:hover {
  background: #40a9ff;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #e8e8e8;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
}

.main-canvas {
  display: block;
  width: 100%;
  height: auto;
  position: relative;
  z-index: 101;
}

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.preview-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 102;
}

.hint {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
}

.properties-panel {
  position: fixed;
  width: 340px;
  padding: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 14px 3px rgba(0, 0, 0, 0.65);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #000000;
    color: #ffffff;
    cursor: move;

    .drag-handle {
      width: 32px;
      height: 32px;
      cursor: move;
      display: flex;
      align-items: center;
      justify-content: center;

      >img {
        width: 24px;
        height: 24px;
      }
    }

    .title {
      font-size: 16px;
      line-height: 32px;
      height: 32px;
      text-align: center;
      flex-grow: 1;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .panel-content {
    padding: 12px;
    overflow-y: auto;
    flex-grow: 1;

    .property-list {
      .property-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
        padding-bottom: 6px;
        border-bottom: 1px solid #f3f3f3;
        flex-wrap: wrap;

        &:last-child {
          margin-bottom: 0;
          border-bottom: none;
        }

        label {
          font-size: 14px;
          color: #666;
        }

        input[type='range'] {
          width: 100%;
        }

        span {
          font-size: 12px;
          color: #999;
          text-align: right;
        }

        .numberEdit {
          display: flex;
          align-items: center;
          justify-content: center;

          .numberInputContainer {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #b2b2b2;
            border-radius: 4px;
            overflow: hidden;
            flex-shrink: 0;

            .numberInput {
              margin-left: 2px;
              width: 40px;
              height: 28px;
              border: none;
              outline: none;
              width: 44px;
            }
          }
        }

        .textContainer {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #b2b2b2;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;

          .textInput {
            margin-left: 2px;
            height: 28px;
            border: none;
            outline: none;
            width: 180px;
          }
        }
      }
    }

    .bottomTools {
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-top: 1px solid #f3f3f3;
      padding-top: 12px;
      margin-top: 12px;

      .layer-controls {
        display: flex;
        gap: 8px;

        .layer-btn {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 4px;
          background: #1890ff;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
        }

        .layer-btn:hover {
          background: #40a9ff;
        }
      }

      .delete-btn {
        width: 100%;
        padding: 8px;
        border: none;
        border-radius: 4px;
        background: #ff4d4f;
        color: #fff;
        cursor: pointer;
        font-size: 14px;
      }

      .delete-btn:hover {
        background: #ff7875;
      }
    }
  }
}
</style>