<template>
  <div class="canvas-3d-container">
    {{ data }}
    <canvas ref="canvasRef" class="drawing-canvas-3d" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Wall, Door, Window } from '../types/map2d'

interface DrawingData {
  walls: Wall[]
  doors: Door[]
  windows: Window[]
}

const props = defineProps<{
  data: DrawingData
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const updateCanvasSize = () => {
  const canvas = canvasRef.value
  if (canvas) {
    const container = canvas.parentElement
    if (container) {
      const rect = container.getBoundingClientRect()
      const width = Math.floor(rect.width)
      const height = Math.floor(rect.height)

      if (width > 0 && height > 0) {
        canvas.width = width
        canvas.height = height
      }
    }
  }
}

const draw3D = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, width, height)

  const centerX = width / 2
  const centerY = height / 2
  const scale = Math.min(width, height) / 2000

  props.data.walls.forEach((wall) => {
    if (wall.points.length < 2) return

    const firstPoint = wall.points[0]
    const startX = centerX + firstPoint.x * scale
    const startY = centerY - firstPoint.y * scale

    ctx.fillStyle = '#e0e0e0'
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(startX, startY)

    for (let i = 1; i < wall.points.length; i++) {
      const point = wall.points[i]
      const x = centerX + point.x * scale
      const y = centerY - point.y * scale
      ctx.lineTo(x, y)
    }

    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    wall.points.forEach((point, index) => {
      const x = centerX + point.x * scale
      const y = centerY - point.y * scale

      ctx.fillStyle = '#1890ff'
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    })
  })

  props.data.doors.forEach((door) => {
    const x = centerX + door.x * scale
    const y = centerY - door.y * scale

    ctx.fillStyle = '#e67e22'
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
  })

  props.data.windows.forEach((win) => {
    const x = centerX + win.x * scale
    const y = centerY - win.y * scale

    ctx.fillStyle = '#3498db'
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
  })
}

onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
  draw3D()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
})

watch(() => props.data, () => {
  draw3D()
}, { deep: true })

watch(() => canvasRef.value?.width, () => {
  draw3D()
})
</script>

<style scoped>
.canvas-3d-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.drawing-canvas-3d {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
