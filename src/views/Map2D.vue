<template>
  <div class="map2d-container">
    <div class="toolbar">
      <button 
        :class="{ active: currentTool === 'wall' }" 
        @click="currentTool = 'wall'"
        type="button"
      >
        墙面
      </button>
      <button 
        :class="{ active: currentTool === 'door' }" 
        @click="currentTool = 'door'"
        type="button"
      >
        门
      </button>
      <button 
        :class="{ active: currentTool === 'window' }" 
        @click="currentTool = 'window'"
        type="button"
      >
        窗户
      </button>
      <button @click="clearDrawing" type="button">
        清空
      </button>
      <button @click="undo" type="button">
        撤销
      </button>
    </div>
    
    <div class="canvas-container">
      <canvas 
        ref="canvasRef" 
        @click="handleCanvasClick"
        @mousemove="handleMouseMove"
        class="drawing-canvas"
      />
    </div>
    
    <div class="info-panel">
      <div>当前模式: {{ currentTool }}</div>
      <div>墙面数量: {{ walls.length }}</div>
      <div>门数量: {{ doors.length }}</div>
      <div>窗户数量: {{ windows.length }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, computed } from 'vue'

interface Point {
  x: number
  y: number
}

interface Wall {
  id: string
  points: Point[]
}

interface Door {
  id: string
  wallId: string
  x: number
  y: number
  width: number
  angle: number
}

interface Window {
  id: string
  wallId: string
  x: number
  y: number
  width: number
  angle: number
}

export default defineComponent({
  name: 'Map2D',
  setup() {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const currentTool = ref<'wall' | 'door' | 'window'>('wall')
    const walls = ref<Wall[]>([])
    const doors = ref<Door[]>([])
    const windows = ref<Window[]>([])
    const tempWallPoints = ref<Point[]>([])
    const hoverPoint = ref<Point | null>(null)
    const lastPoint = ref<Point | null>(null)
    const history = ref<Wall[][]>([])
    
    const canvasWidth = 800
    const canvasHeight = 600
    const snapThreshold = 20
    const doorWidth = 90
    const windowWidth = 120
    
    onMounted(() => {
      const canvas = canvasRef.value
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.canvas.width = canvasWidth
          ctx.canvas.height = canvasHeight
          draw()
        }
        
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            if (tempWallPoints.value.length > 1) {
              const newWall: Wall = {
                id: Date.now().toString(),
                points: [...tempWallPoints.value]
              }
              walls.value.push(newWall)
              history.value.push(JSON.parse(JSON.stringify(walls.value)))
              tempWallPoints.value = []
              lastPoint.value = null
            }
            draw()
          }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        
        return () => {
          window.removeEventListener('keydown', handleKeyDown)
        }
      }
    })
    
    const draw = () => {
      const canvas = canvasRef.value
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      
      walls.value.forEach((wall) => {
        if (wall.points.length < 2) return
        ctx.beginPath()
        ctx.moveTo(wall.points[0].x, wall.points[0].y)
        for (let i = 1; i < wall.points.length; i++) {
          ctx.lineTo(wall.points[i].x, wall.points[i].y)
        }
        ctx.stroke()
      })
      
      if (currentTool.value === 'wall' && tempWallPoints.value.length > 0) {
        ctx.strokeStyle = '#42b983'
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(tempWallPoints.value[0].x, tempWallPoints.value[0].y)
        for (let i = 1; i < tempWallPoints.value.length; i++) {
          ctx.lineTo(tempWallPoints.value[i].x, tempWallPoints.value[i].y)
        }
        if (hoverPoint.value) {
          ctx.lineTo(hoverPoint.value.x, hoverPoint.value.y)
        }
        ctx.stroke()
        
        tempWallPoints.value.forEach((point, index) => {
          drawPoint(ctx, point.x, point.y, '#42b983')
          if (index > 0) {
            const prev = tempWallPoints.value[index - 1]
            ctx.fillStyle = '#42b983'
            ctx.font = '12px Arial'
            const dist = Math.round(Math.hypot(point.x - prev.x, point.y - prev.y))
            const midX = (point.x + prev.x) / 2
            const midY = (point.y + prev.y) / 2
            ctx.fillText(`${dist}px`, midX, midY - 5)
          }
        })
        
        if (hoverPoint.value) {
          drawPoint(ctx, hoverPoint.value.x, hoverPoint.value.y, '#42b983')
        }
      }
      
      doors.value.forEach((door) => {
        drawEntity(ctx, door.x, door.y, door.width, door.angle, '#e67e22', 'door')
      })
      
      windows.value.forEach((win) => {
        drawEntity(ctx, win.x, win.y, win.width, win.angle, '#3498db', 'window')
      })
      
      if (hoverPoint.value && currentTool.value !== 'wall') {
        const nearestWall = getNearestWall(hoverPoint.value)
        if (nearestWall) {
          const { wall, pointOnWall, angle } = nearestWall
          if (currentTool.value === 'door') {
            drawPreviewEntity(ctx, pointOnWall.x, pointOnWall.y, doorWidth, angle, '#e67e22', 'door')
          } else if (currentTool.value === 'window') {
            drawPreviewEntity(ctx, pointOnWall.x, pointOnWall.y, windowWidth, angle, '#3498db', 'window')
          }
        }
      }
    }
    
    const drawPoint = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
    
    const drawEntity = (
      ctx: CanvasRenderingContext2D, 
      x: number, 
      y: number, 
      width: number, 
      angle: number, 
      color: string,
      type: 'door' | 'window'
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      
      ctx.fillStyle = color
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      
      if (type === 'door') {
        ctx.fillRect(-width / 2, -3, width, 6)
        ctx.beginPath()
        ctx.arc(0, 0, width / 2, -Math.PI / 4, Math.PI / 4)
        ctx.stroke()
      } else {
        ctx.fillRect(-width / 2, -3, width, 6)
        ctx.setLineDash([5, 5])
        ctx.stroke()
      }
      
      ctx.restore()
    }
    
    const drawPreviewEntity = (
      ctx: CanvasRenderingContext2D, 
      x: number, 
      y: number, 
      width: number, 
      angle: number, 
      color: string,
      type: 'door' | 'window'
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.setLineDash([8, 4])
      
      if (type === 'door') {
        ctx.beginPath()
        ctx.moveTo(-width / 2, -10)
        ctx.lineTo(-width / 2, 10)
        ctx.lineTo(0, 20)
        ctx.lineTo(width / 2, 10)
        ctx.lineTo(width / 2, -10)
        ctx.closePath()
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.moveTo(-width / 2, -5)
        ctx.lineTo(-width / 2, 5)
        ctx.lineTo(width / 2, 5)
        ctx.lineTo(width / 2, -5)
        ctx.closePath()
        ctx.stroke()
      }
      
      ctx.restore()
    }
    
    const getNearestWall = (point: Point) => {
      let nearestWall: Wall | null = null
      let nearestPoint: Point | null = null
      let minDistance = Infinity
      let nearestAngle = 0
      
      walls.value.forEach((wall) => {
        for (let i = 0; i < wall.points.length - 1; i++) {
          const p1 = wall.points[i]
          const p2 = wall.points[i + 1]
          
          const distance = pointToLineDistance(point, p1, p2)
          
          if (distance < minDistance) {
            minDistance = distance
            nearestWall = wall
            nearestPoint = getClosestPointOnLine(point, p1, p2)
            nearestAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
          }
        }
      })
      
      if (nearestPoint && minDistance < snapThreshold && nearestWall) {
        return { wall: nearestWall, pointOnWall: nearestPoint, angle: nearestAngle }
      }
      
      return null
    }
    
    const pointToLineDistance = (p: Point, a: Point, b: Point) => {
      const A = p.x - a.x
      const B = p.y - a.y
      const C = b.x - a.x
      const D = b.y - a.y
      
      const dot = A * C + B * D
      const lenSq = C * C + D * D
      let param = -1
      
      if (lenSq !== 0) {
        param = dot / lenSq
      }
      
      let xx, yy
      
      if (param < 0) {
        xx = a.x
        yy = a.y
      } else if (param > 1) {
        xx = b.x
        yy = b.y
      } else {
        xx = a.x + param * C
        yy = a.y + param * D
      }
      
      const dx = p.x - xx
      const dy = p.y - yy
      
      return Math.sqrt(dx * dx + dy * dy)
    }
    
    const getClosestPointOnLine = (p: Point, a: Point, b: Point) => {
      const A = p.x - a.x
      const B = p.y - a.y
      const C = b.x - a.x
      const D = b.y - a.y
      
      const dot = A * C + B * D
      const lenSq = C * C + D * D
      let param = -1
      
      if (lenSq !== 0) {
        param = dot / lenSq
      }
      
      if (param < 0) {
        return { x: a.x, y: a.y }
      } else if (param > 1) {
        return { x: b.x, y: b.y }
      } else {
        return {
          x: a.x + param * C,
          y: a.y + param * D
        }
      }
    }
    
    const handleCanvasClick = (e: MouseEvent) => {
      const canvas = canvasRef.value
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      if (currentTool.value === 'wall') {
        let clickPoint = { x, y }
        
        if (tempWallPoints.value.length > 0) {
          const last = tempWallPoints.value[tempWallPoints.value.length - 1]
          const snapped = getSnapPoint(last, clickPoint)
          const dist = Math.hypot(snapped.x - last.x, snapped.y - last.y)
          
          if (dist < 10) {
            if (tempWallPoints.value.length > 1) {
              const newWall: Wall = {
                id: Date.now().toString(),
                points: [...tempWallPoints.value]
              }
              walls.value.push(newWall)
              history.value.push(JSON.parse(JSON.stringify(walls.value)))
              tempWallPoints.value = []
              lastPoint.value = null
            }
            return
          }
          
          clickPoint = snapped
        }
        
        tempWallPoints.value.push(clickPoint)
        lastPoint.value = clickPoint
      } else {
        const nearest = getNearestWall({ x, y })
        if (nearest) {
          if (currentTool.value === 'door') {
            const door: Door = {
              id: Date.now().toString(),
              wallId: nearest.wall.id,
              x: nearest.pointOnWall.x,
              y: nearest.pointOnWall.y,
              width: doorWidth,
              angle: nearest.angle
            }
            doors.value.push(door)
          } else if (currentTool.value === 'window') {
            const windowItem: Window = {
              id: Date.now().toString(),
              wallId: nearest.wall.id,
              x: nearest.pointOnWall.x,
              y: nearest.pointOnWall.y,
              width: windowWidth,
              angle: nearest.angle
            }
            windows.value.push(windowItem)
          }
        }
      }
      
      draw()
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.value
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      if (currentTool.value === 'wall') {
        if (tempWallPoints.value.length > 0) {
          const last = tempWallPoints.value[tempWallPoints.value.length - 1]
          const dist = Math.hypot(x - last.x, y - last.y)
          
          if (dist < snapThreshold) {
            hoverPoint.value = { ...last }
          } else {
            const snappedPoint = getSnapPoint(last, { x, y })
            hoverPoint.value = snappedPoint
          }
        }
      } else {
        const nearest = getNearestWall({ x, y })
        if (nearest) {
          hoverPoint.value = nearest.pointOnWall
        } else {
          hoverPoint.value = null
        }
      }
      
      draw()
    }
    
    const getSnapPoint = (start: Point, current: Point): Point => {
      const dx = current.x - start.x
      const dy = current.y - start.y
      const angle = Math.atan2(dy, dx)
      const angleDeg = angle * 180 / Math.PI
      
      let snappedX = current.x
      let snappedY = current.y
      
      if (Math.abs(angleDeg) < 15 || Math.abs(Math.abs(angleDeg) - 180) < 15) {
        snappedY = start.y
      } else if (Math.abs(angleDeg - 90) < 15 || Math.abs(angleDeg + 90) < 15) {
        snappedX = start.x
      } else if (Math.abs(Math.abs(angleDeg) - 45) < 15 || Math.abs(Math.abs(angleDeg) - 135) < 15) {
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        const target = Math.max(absDx, absDy)
        if (dx >= 0 && dy >= 0) {
          snappedX = start.x + target
          snappedY = start.y + target
        } else if (dx >= 0 && dy < 0) {
          snappedX = start.x + target
          snappedY = start.y - target
        } else if (dx < 0 && dy >= 0) {
          snappedX = start.x - target
          snappedY = start.y + target
        } else {
          snappedX = start.x - target
          snappedY = start.y - target
        }
      }
      
      return { x: Math.round(snappedX), y: Math.round(snappedY) }
    }
    
    const clearDrawing = () => {
      if (confirm('确定要清空所有绘制内容吗？')) {
        walls.value = []
        doors.value = []
        windows.value = []
        tempWallPoints.value = []
        history.value = []
        draw()
      }
    }
    
    const undo = () => {
      if (history.value.length > 0) {
        walls.value = history.value.pop() || []
        draw()
      }
    }
    
    return {
      canvasRef,
      currentTool,
      walls,
      doors,
      windows,
      handleCanvasClick,
      handleMouseMove,
      clearDrawing,
      undo
    }
  }
})
</script>

<style scoped>
.map2d-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: #e4e6eb;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.toolbar button:hover {
  background: #d9d9d9;
}

.toolbar button.active {
  background: #1890ff;
  color: white;
}

.canvas-container {
  margin-bottom: 20px;
}

.drawing-canvas {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: crosshair;
}

.info-panel {
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  color: #666;
}

.info-panel div {
  margin: 5px 0;
}
</style>
