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
        <button class="action-btn" @click="exportJSON">导出JSON</button>
        <button class="action-btn" @click="importJSON">导入JSON</button>
        <button class="action-btn primary" @click="exportImage">导出PNG</button>
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
        <span class="drag-handle">☰</span>
        <h3>属性</h3>
      </div>
      <div class="panel-content">
        <!-- {{ editParams }} -->
        <div class="property-item" v-for="item in editParams" :key="item.id">
          <label>{{ item.label }}</label>
          <span v-if="item.dataType === 'string'">{{ item.value }}</span>
          <div v-else-if="item.dataType === 'number'">
            <input type="range" v-model.number="item.value" :min="item.min" :max="item.max" :step="item.step"
              @input="render" />
          </div>
          <span v-else-if="item.dataType === 'boolean'">{{ item.value ? '是' : '否' }}</span>
          <!-- <span v-else>{{ item.value }}</span> -->
        </div>
        <!-- <div class="property-item">
          <label>透明度</label>
          <input type="range" v-model.number="selectedElement.data.opacity" min="0" max="1" step="0.1"
            @input="render" />
          <span>{{ selectedElement.data.opacity }}</span>
        </div>
        <template v-if="selectedElement.type === 'sprite'">
          <div class="property-item">
            <label>宽度</label>
            <input type="range" v-model.number="selectedElement.data.width" min="10" max="200" @input="render" />
          </div>
          <div class="property-item">
            <label>高度</label>
            <input type="range" v-model.number="selectedElement.data.height" min="10" max="200" @input="render" />
          </div>
        </template>
<template v-if="selectedElement.type === 'polyline'">
          <div class="property-item">
            <label>线宽</label>
            <input type="range" v-model.number="selectedElement.data.width" min="5" max="100" @input="render" />
          </div>
        </template> -->
        <div class="property-item">
          <button class="delete-btn" @click="deleteElement">删除元素</button>
        </div>
      </div>
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
const panelPosition = ref({ x: 20, y: 20 })
const isDraggingPanel = ref(false)
const panelDragOffset = ref({ x: 0, y: 0 })
const isResizing = ref(false)
const resizeCorner = ref<'tl' | 'br' | null>(null)
const isDraggingPoint = ref(false)
const draggingPointIndex = ref(-1)

const selectedElement = computed<BaseElement<any> | null>(() => {
  if (!selectedElementId.value) return null
  return world.getElementById(selectedElementId.value) || null
})

function selectSprite(item: BaseElementDefinition) {
  console.log('selectSprite', item)
  // 如果正在绘制，先取消（无论 drawingElement 是否存在）
  if (world.isDrawing) {
    world.cancelDrawing()
  }
  world.setSelectedSprite(item)
  world.setTool(item.type)
  world.startDrawing()
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

function handleMouseDown(e: MouseEvent) {
  const pos = getCanvasPos(e)
  mousePos.value = pos

  const now = Date.now()
  const isDoubleClick = now - world.lastClickTime < 300
  world.lastClickTime = now

  const worldPos = {
    x: (pos.x - world.canvasOffset.x) / world.scale,
    y: (pos.y - world.canvasOffset.y) / world.scale,
  }

  switch (world.currentTool) {
    case 'sprite':
      if (world.isDrawing) {
        if (world.drawingElement) {
          const sprite = world.drawingElement as SpriteElement<SpriteElementData>;
          sprite.data.x = worldPos.x
          sprite.data.y = worldPos.y
          const elementId = sprite.data.id
          world.finishDrawing()
          selectedElementId.value = elementId
          editParams.value = JSON.parse(JSON.stringify(sprite.setEditParams()))
        } else {
          world.cancelDrawing()
        }
        world.setTool('select')
        if (renderer) {
          renderer.renderPreview(world, pos)
        }
        render()
        return
      }
      break

    case 'polyline':
    case 'polygon':
      if (!world.isDrawing) {
        if (world.selectedSprite !== null) {
          world.startDrawing()
        }
      }

      if (isDoubleClick) {
        const minPoints = world.currentTool === 'polygon' ? 3 : 2
        if (world.drawingElement &&
          (world.drawingElement as any).data.points.length >= minPoints) {
          const elementId = (world.drawingElement as any).data.id
          world.finishDrawing()
          selectedElementId.value = elementId
          world.setTool('select')
          render()
          return
        }
      }

      world.addDrawingPoint(worldPos)
      break

    case 'select':
    case 'move': {
      const element = world.findElementAt(worldPos)
      if (element && element instanceof SpriteElement) {
        const sprite = element as SpriteElement<SpriteElementData>
        const hitCorner = sprite.hitTestResizeHandle(worldPos)
        if (hitCorner) {
          world.selectElement(element.data.id)
          selectedElementId.value = element.data.id
          isResizing.value = true
          resizeCorner.value = hitCorner
          world.isDragging = false
          world.isPanning = false
          render()
          return
        }
      }

      if (element && element instanceof PolylineElement) {
        const polyline = element as PolylineElement<PolylineElementData>
        const pointIndex = polyline.hitTestPoint(worldPos)
        if (pointIndex !== -1) {
          world.selectElement(element.data.id)
          selectedElementId.value = element.data.id
          isDraggingPoint.value = true
          draggingPointIndex.value = pointIndex
          world.isDragging = false
          world.isPanning = false
          render()
          return
        }
      }

      if (element) {
        world.selectElement(element.data.id)
        selectedElementId.value = element.data.id
        world.isDragging = true
        world.isPanning = false
        const elementPos = element instanceof SpriteElement
          ? { x: (element as SpriteElement<SpriteElementData>).data.x, y: (element as SpriteElement<SpriteElementData>).data.y }
          : (element as any).data.points[0]
        world.dragOffset = {
          x: worldPos.x - elementPos.x,
          y: worldPos.y - elementPos.y,
        }
      } else {
        world.selectElement(null)
        selectedElementId.value = null
        world.isDragging = false
        world.isPanning = true
        world.panStartPos = pos
        world.panStartOffset = { ...world.canvasOffset }
      }
      break
    }

    case 'pan':
      world.isPanning = true
      world.panStartPos = pos
      world.panStartOffset = { ...world.canvasOffset }
      world.selectElement(null)
      break
  }

  render()
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
      x: (pos.x - world.canvasOffset.x) / world.scale,
      y: (pos.y - world.canvasOffset.y) / world.scale,
    }
    const element = world.getSelectedElement()
    if (element && element instanceof SpriteElement) {
      const sprite = element as SpriteElement<SpriteElementData>
      const { x, y, width, height } = sprite.data

      if (resizeCorner.value === 'br') {
        const newWidth = Math.max(20, worldPos.x - (x - width / 2))
        const newHeight = Math.max(20, worldPos.y - (y - height / 2))
        sprite.data.width = newWidth
        sprite.data.height = newHeight
      } else if (resizeCorner.value === 'tl') {
        const newWidth = Math.max(20, (x + width / 2) - worldPos.x)
        const newHeight = Math.max(20, (y + height / 2) - worldPos.y)
        sprite.data.x = x + (width - newWidth) / 2
        sprite.data.y = y + (height - newHeight) / 2
        sprite.data.width = newWidth
        sprite.data.height = newHeight
      }
    }
    render()
    return
  }

  if (isDraggingPoint.value) {
    const worldPos = {
      x: (pos.x - world.canvasOffset.x) / world.scale,
      y: (pos.y - world.canvasOffset.y) / world.scale,
    }
    const element = world.getSelectedElement()
    if (element && element instanceof PolylineElement) {
      const polyline = element as PolylineElement<PolylineElementData>
      polyline.movePoint(draggingPointIndex.value, worldPos)
    }
    render()
    return
  }

  if (world.isDragging) {
    const worldPos = {
      x: (pos.x - world.canvasOffset.x) / world.scale,
      y: (pos.y - world.canvasOffset.y) / world.scale,
    }
    const newX = worldPos.x - world.dragOffset.x
    const element = world.getSelectedElement()
    if (element) {
      const oldPos = element instanceof SpriteElement
        ? { x: (element as SpriteElement<SpriteElementData>).data.x, y: (element as SpriteElement<SpriteElementData>).data.y }
        : (element as any).data.points[0]
      const dx = newX - oldPos.x
      const dy = (worldPos.y - world.dragOffset.y) - oldPos.y
      world.translateSelectedElement(dx, dy)
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

  console.log('resize')
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

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    console.log(1)
    try {
      console.log(2)
      const data = JSON.parse(e.target?.result as string)
      console.log(3, data)
      world.importElements(data)
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
      // console.log('111', element.data, item.id, item.value)
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
}

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.preview-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
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
  width: 200px;
  padding: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.properties-panel .panel-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #000000;
  border-bottom: 1px solid #333333;
  cursor: move;
}

.properties-panel .panel-header .drag-handle {
  margin-right: 8px;
  color: #ffffff;
  font-size: 12px;
}

.properties-panel .panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #ffffff;
}

.properties-panel .panel-content {
  padding: 16px;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.property-item label {
  font-size: 14px;
  color: #666;
}

.property-item input[type='range'] {
  width: 100%;
}

.property-item span {
  font-size: 12px;
  color: #999;
  text-align: right;
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
</style>