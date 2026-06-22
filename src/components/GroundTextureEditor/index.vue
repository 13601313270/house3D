<template>
  <div class="ground-texture-editor">
    <div class="toolbar">
      <div class="element-library">
        <button v-for="item in world.spriteLibrary" :key="item.id" class="element-btn" :class="{
          active: world.selectedSprite?.id === item.id,
          'sprite-type': item.type === 'sprite',
          'line-type': item.type === 'polyline',
          'polygon-type': item.type === 'polygon'
        }" @click="selectSprite(item)" :title="item.name">
          <span>{{ item.icon }}</span>
          <span class="element-name">{{ item.name }}</span>
        </button>
      </div>

      <div class="actions">
        <button class="action-btn" @click="clearCanvas">清空</button>
        <button class="action-btn" @click="exportJSON">导出</button>
        <button class="action-btn" @click="importJSON">导入</button>
        <button class="action-btn primary" @click="exportImage">PNG</button>
      </div>
      <input ref="fileInputRef" type="file" accept=".json" class="file-input" @change="handleFileSelect" />
    </div>

    <div class="canvas-container" ref="canvasWrapperRef">
      <div class="canvas-wrapper">
        <canvas ref="gridCanvasRef" class="grid-canvas"></canvas>
        <canvas ref="canvasRef" class="main-canvas" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
          @mouseup="handleMouseUp" @mouseleave="handleMouseUp" @wheel="handleWheel"></canvas>
        <canvas ref="previewCanvasRef" class="preview-canvas"></canvas>

        <div v-if="world.isDrawing && (world.currentTool === 'polyline' || world.currentTool === 'polygon')"
          class="hint">
          {{ world.currentTool === 'polygon' ? '点击画布添加顶点，双击完成绘制（至少3点），按Esc取消' : '点击画布添加点，双击完成绘制（至少2点），按Esc取消' }}
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
            <span v-if="item.dataType === 'string'">{{ item.value }}</span>
            <div v-else-if="item.dataType === 'number'" class="numberEdit">
              <input type="range" v-model.number="item.value" :min="item.min" :max="item.max" :step="item.step"
                @input="render" />
              <div class="numberInputContainer">
                <input type="number" class="numberInput" v-model.number="item.value" :min="item.min" :max="item.max"
                  :step="item.step" @input="render" />
                <div v-if="item.unit" class="unit">{{ item.unit }}</div>
              </div>
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

    <div class="panel-close-btn" @click="emit('close')">
      <img src="@/assets/close.svg" alt="close" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { TextureWorld } from './world'
import { CanvasRenderer } from './renderer'
import type { BaseElement, BaseElementData, BaseElementDefinition } from './types'
import { SpriteElement, SpriteElementData } from './types/spriteElement'
import { editItem } from '@/entities'
import { PolylineElement, PolylineElementData } from './types/polylineElement'
import { PolygonElement } from './types/polygonElement'

const emit = defineEmits(['close'])
const canvasRef = ref<HTMLCanvasElement | null>(null)
const gridCanvasRef = ref<HTMLCanvasElement | null>(null)
const previewCanvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWrapperRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const world = new TextureWorld()
let renderer: CanvasRenderer | null = null
let resizeObserver: ResizeObserver | null = null

const mousePos = ref({ x: 0, y: 0 })
const selectedElementId = ref<string | null>(null)
const editParams = ref<editItem[]>([])
const panelPosition = ref({ x: window.innerWidth - 360, y: 20 })
const isDraggingPanel = ref(false)
const panelDragOffset = ref({ x: 0, y: 0 })
const isResizing = ref(false)
const resizeCorner = ref<'tl' | 'br' | null>(null)
const isDraggingPoint = ref(false)
const draggingPointIndex = ref(-1)
const dragPointOffset = ref({ x: 0, y: 0 })
const resizeOffset = ref({ x: 0, y: 0 })

const selectedElement = computed<BaseElement<any> | null>(() => {
  if (!selectedElementId.value) return null
  return world.getElementById(selectedElementId.value) || null
})

async function selectSprite(item: BaseElementDefinition) {
  // 如果正在绘制，先取消（无论 drawingElement 是否存在）
  if (world.isDrawing) {
    world.cancelDrawing()
  }
  world.setTool(item.type)
  await world.setSelectedSprite(item)
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
  const isDoubleClick = now - world.lastClickTime < 300
  world.lastClickTime = now

  const worldPos = {
    x: Math.round((pos.x - world.canvasOffset.x) / world.scale),
    y: Math.round((pos.y - world.canvasOffset.y) / world.scale),
  }

  // 正在绘制：处理绘制逻辑
  if (world.isDrawing) {
    if (world.currentTool === 'sprite' && world.drawingElement) {
      const sprite = world.drawingElement as SpriteElement<SpriteElementData>
      sprite.data.x = worldPos.x
      sprite.data.y = worldPos.y
      const elementId = sprite.data.id
      world.finishDrawing()
      selectedElementId.value = elementId
      editParams.value = JSON.parse(JSON.stringify(sprite.setEditParams()))
      renderer?.renderPreview(world, pos)
      render()
      return
    }

    if (world.currentTool === 'polyline' || world.currentTool === 'polygon') {
      if (isDoubleClick) {
        const minPoints = world.currentTool === 'polygon' ? 3 : 2
        const drawing = world.drawingElement as PolylineElement<PolylineElementData>
        if (drawing && drawing.data.points.length >= minPoints) {
          const elementId = drawing.data.id
          world.finishDrawing()
          selectedElementId.value = elementId
          render()
          return
        }
      }
      world.addDrawingPoint(worldPos)
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
  const selectedEl = world.getSelectedElement()
  if (selectedEl && selectedEl instanceof SpriteElement && selectedEl.data.id === selectedElementId.value) {
    const hitCorner = selectedEl.hitTestResizeHandle(worldPos)
    if (hitCorner) {
      isResizing.value = true
      resizeCorner.value = hitCorner
      world.isDragging = false
      world.isPanning = false

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
  for (const el of world.elements) {
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
  const element = world.findElementAt(worldPos)
  if (!element) {
    // 空白区域：取消选择，开始平移
    world.selectElement(null)
    selectedElementId.value = null
    editParams.value = []
    world.isDragging = false
    world.isPanning = true
    world.panStartPos = screenPos
    world.panStartOffset = { ...world.canvasOffset }
    return
  }

  // 3. 检测元素
  selectAndEdit(element)

  // 4. 根据元素类型设置拖拽模式
  if (element instanceof PolylineElement) {
    world.isDragging = false
    world.isPanning = true
    world.panStartPos = screenPos
    world.panStartOffset = { ...world.canvasOffset }
  } else if (element instanceof PolygonElement) {
    const polygon = element
    if (polygon.hitTestDragHandle(worldPos)) {
      world.isDragging = true
      world.isPanning = false
      const center = polygon.getCenter()
      world.dragOffset = {
        x: worldPos.x - center.x,
        y: worldPos.y - center.y,
      }
    } else {
      world.isDragging = false
      world.isPanning = true
      world.panStartPos = screenPos
      world.panStartOffset = { ...world.canvasOffset }
    }
  } else {
    // Sprite 或其他元素
    world.isDragging = true
    world.isPanning = false
    const elementPos = 'x' in element.data
      ? { x: (element as SpriteElement<SpriteElementData>).data.x, y: (element as SpriteElement<SpriteElementData>).data.y }
      : (element as PolylineElement<PolylineElementData>).data.points[0]
    world.dragOffset = {
      x: worldPos.x - elementPos.x,
      y: worldPos.y - elementPos.y,
    }
  }
}

function selectAndEdit(element: BaseElement<BaseElementData>) {
  world.selectElement(element.data.id)
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
  world.isDragging = false
  world.isPanning = false
}

function handleMouseMove(e: MouseEvent) {
  const pos = getCanvasPos(e)
  mousePos.value = pos

  if (world.isPanning) {
    world.updatePanOffset({
      x: world.panStartOffset.x + (pos.x - world.panStartPos.x),
      y: world.panStartOffset.y + (pos.y - world.panStartPos.y),
    })
    render()
    return
  }

  if (renderer) {
    renderer.renderPreview(world, pos)
  }

  if (isResizing.value) {
    const worldPos = {
      x: Math.round((pos.x - world.canvasOffset.x) / world.scale),
      y: Math.round((pos.y - world.canvasOffset.y) / world.scale),
    }
    const element = world.getSelectedElement()
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
      x: Math.round((pos.x - world.canvasOffset.x) / world.scale),
      y: Math.round((pos.y - world.canvasOffset.y) / world.scale),
    }
    const element = world.getSelectedElement()
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

  if (world.isDragging) {
    const worldPos = {
      x: Math.round((pos.x - world.canvasOffset.x) / world.scale),
      y: Math.round((pos.y - world.canvasOffset.y) / world.scale),
    }
    const element = world.getSelectedElement()
    if (element) {
      if (element instanceof PolygonElement) {
        const polygon = element as PolygonElement<any>
        const center = polygon.getCenter()
        const dx = worldPos.x - world.dragOffset.x - center.x
        const dy = worldPos.y - world.dragOffset.y - center.y
        world.translateSelectedElement(dx, dy)
      } else {
        const oldPos = element instanceof SpriteElement
          ? { x: (element as SpriteElement<SpriteElementData>).data.x, y: (element as SpriteElement<SpriteElementData>).data.y }
          : (element as any).data.points[0]
        const newX = worldPos.x - world.dragOffset.x
        const dx = newX - oldPos.x
        const dy = (worldPos.y - world.dragOffset.y) - oldPos.y
        world.translateSelectedElement(dx, dy)
      }
    }
    render()
    return
  }

  if (world.isDrawing) {
    render()
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleMouseUp(_e: MouseEvent) {
  world.isDragging = false
  world.isPanning = false
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
  const newScale = Math.max(0.1, Math.min(5, world.scale * zoomFactor))

  const worldX = (pos.x - world.canvasOffset.x) / world.scale
  const worldY = (pos.y - world.canvasOffset.y) / world.scale

  world.canvasOffset.x = pos.x - worldX * newScale
  world.canvasOffset.y = pos.y - worldY * newScale
  world.scale = newScale

  render()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (world.isDrawing) {
      const minPoints = world.currentTool === 'polygon' ? 3 : 2
      if (world.drawingElement &&
        (world.drawingElement as any).data.points.length >= minPoints) {
        world.finishDrawing()
        world.setTool('select')
      } else {
        world.cancelDrawing()
      }
      render()
    }
  }
}

function render() {
  renderer?.render(world, mousePos.value)
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

  world.canvasOffset = {
    x: world.canvasOffset.x * offsetRatioX,
    y: world.canvasOffset.y * offsetRatioY,
  }

  render()
}

function clearCanvas() {
  world.clear()
  selectedElementId.value = null
  render()
}

function bringForward() {
  world.bringForward()
  render()
}

function sendBackward() {
  world.sendBackward()
  render()
}

function deleteElement() {
  const element = world.getSelectedElement()
  if (element) {
    world.removeElement(element)
    selectedElementId.value = null
    render()
  }
}

function exportJSON() {
  const data = world.exportElements()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ground-texture-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importJSON() {
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      await world.importElements(data)
      selectedElementId.value = null
      render()
    } catch (error) {
      alert('导入失败，请确保文件是有效的JSON格式')
    }
  }
  reader.readAsText(file)
  input.value = ''
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

function exportImage() {
  const canvas = canvasRef.value
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `ground-texture-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

watch(
  () => world.selectedElementId,
  () => {
    render()
  }
)

watch(
  () => world.elements.length,
  () => {
    render()
  }
)

onMounted(() => {
  if (!canvasWrapperRef.value) return
  const initialWidth = canvasWrapperRef.value.clientWidth
  const initialHeight = canvasWrapperRef.value.clientHeight
  world.canvasOffset = {
    x: initialWidth / 2,
    y: initialHeight / 2,
  }

  if (canvasRef.value && gridCanvasRef.value && previewCanvasRef.value) {
    renderer = new CanvasRenderer(
      canvasRef.value,
      gridCanvasRef.value,
      previewCanvasRef.value,
      initialWidth,
      initialHeight
    )
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

watch(() => editParams.value, (newVal) => {
  const element = world.getSelectedElement()
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
  flex-direction: column;
  gap: 8px;
  margin-left: auto;
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

.panel-close-btn {
  position: absolute;
  top: 0px;
  right: 0px;
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  >img {
    width: 24px;
    height: 24px;
  }
}
</style>