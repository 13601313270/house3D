import type { Point, ElementType, SpriteLibraryItem, ToolInfo } from './types'
import { BaseElement, SpriteElement, PolylineElement, PolygonElement } from './types'

export class TextureWorld {
  elements: BaseElement[] = []
  selectedElementId: string | null = null
  currentTool: string = 'select'
  selectedSprite: string | null = null
  isDrawing: boolean = false
  isDragging: boolean = false
  isPanning: boolean = false
  canvasOffset: Point = { x: 0, y: 0 }
  scale: number = 1
  dragOffset: Point = { x: 0, y: 0 }
  panStartPos: Point = { x: 0, y: 0 }
  panStartOffset: Point = { x: 0, y: 0 }
  drawingElement: BaseElement | null = null
  lastClickTime: number = 0

  tools: ToolInfo[] = [
    { id: 'select', name: '选择', icon: '👆' },
    { id: 'move', name: '移动', icon: '✋' },
    { id: 'pan', name: '平移画布', icon: '🖐️' },
  ]

  spriteLibrary: SpriteLibraryItem[] = [
    { id: 'manhole', name: '井盖', icon: '🗑️', color: '#4a4a4a', drawType: 'sprite' },
    { id: 'grass', name: '草坪', icon: '🌿', color: '#228B22', drawType: 'polygon' },
    { id: 'tile', name: '地砖', icon: '🧱', color: '#CD853F', drawType: 'polygon' },
    { id: 'sign', name: '警示牌', icon: '⚠️', color: '#FFD700', drawType: 'sprite' },
    { id: 'lamp', name: '路灯', icon: '💡', color: '#8B4513', drawType: 'sprite' },
    { id: 'road', name: '道路', icon: '🛣️', color: '#444444', drawType: 'polyline', defaultWidth: 40 },
    { id: 'crosswalk', name: '斑马线', icon: '🦓', color: '#FFFFFF', drawType: 'polyline', defaultWidth: 30 },
    { id: 'flower', name: '花坛', icon: '🌸', color: '#FF69B4', drawType: 'polygon' },
  ]

  private eventListeners: Record<string, Set<(data: any) => void>> = {}

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = new Set()
    }
    this.eventListeners[event].add(callback)
  }

  off(event: string, callback: (data: any) => void): void {
    this.eventListeners[event]?.delete(callback)
  }

  private emit(event: string, data: any): void {
    this.eventListeners[event]?.forEach((callback) => callback(data))
  }

  addElement(element: BaseElement): void {
    this.elements.push(element)
    this.emit('elementAdded', element)
  }

  removeElement(element: BaseElement): void {
    const index = this.elements.findIndex((e) => e.data.id === element.data.id)
    if (index !== -1) {
      this.elements.splice(index, 1)
      if (this.selectedElementId === element.data.id) {
        this.selectedElementId = null
      }
      this.emit('elementRemoved', element)
    }
  }

  getElementById(id: string): BaseElement | undefined {
    return this.elements.find((e) => e.data.id === id)
  }

  selectElement(id: string | null): void {
    this.selectedElementId = id
    this.emit('selectionChanged', id)
  }

  findElementAt(pos: Point): BaseElement | null {
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const element = this.elements[i]
      if (element.containsPoint(pos)) {
        return element
      }
    }
    return null
  }

  startDrawing(type: ElementType, spriteId?: string): void {
    this.isDrawing = true
    const id = Date.now().toString()
    
    const sprite = spriteId ? this.spriteLibrary.find(s => s.id === spriteId) : null
    const color = sprite?.color || '#333333'
    const width = sprite?.defaultWidth || 20

    switch (type) {
      case 'sprite':
        break
      case 'polyline':
        this.drawingElement = new PolylineElement(this, {
          id,
          points: [],
          width,
          texture: sprite?.id || 'road',
          color,
          opacity: 1,
          zIndex: this.elements.length,
        })
        break
      case 'polygon':
        this.drawingElement = new PolygonElement(this, {
          id,
          points: [],
          texture: sprite?.id || 'grass',
          color,
          textureScale: 1,
          opacity: 1,
          zIndex: this.elements.length,
        })
        break
    }
  }

  addDrawingPoint(pos: Point): void {
    if (this.drawingElement) {
      this.drawingElement.handleMouseDown(pos)
    }
  }

  finishDrawing(): boolean {
    if (!this.drawingElement) return false

    if (this.drawingElement.type === 'polyline') {
      const polyline = this.drawingElement as PolylineElement
      if (polyline.data.points.length >= 2) {
        this.addElement(polyline)
        this.selectElement(polyline.data.id)
        this.drawingElement = null
        this.isDrawing = false
        return true
      }
    } else if (this.drawingElement.type === 'polygon') {
      const polygon = this.drawingElement as PolygonElement
      if (polygon.data.points.length >= 3) {
        this.addElement(polygon)
        this.selectElement(polygon.data.id)
        this.drawingElement = null
        this.isDrawing = false
        return true
      }
    }

    this.drawingElement = null
    this.isDrawing = false
    return false
  }

  cancelDrawing(): void {
    this.drawingElement = null
    this.isDrawing = false
  }

  createSprite(pos: Point, spriteId: string): SpriteElement | null {
    const sprite = this.spriteLibrary.find((s) => s.id === spriteId)
    if (!sprite) return null

    const element = new SpriteElement(this, {
      id: Date.now().toString(),
      x: pos.x,
      y: pos.y,
      width: 60,
      height: 60,
      rotation: 0,
      texture: sprite.id,
      opacity: 1,
      zIndex: this.elements.length,
      name: sprite.name,
    })

    this.addElement(element)
    this.selectElement(element.data.id)
    return element
  }

  translateSelectedElement(dx: number, dy: number): void {
    if (!this.selectedElementId) return
    const element = this.getElementById(this.selectedElementId)
    if (element) {
      element.translate(dx, dy)
    }
  }

  updatePanOffset(offset: Point): void {
    this.canvasOffset = offset
    this.emit('panChanged', offset)
  }

  clear(): void {
    this.elements = []
    this.selectedElementId = null
    this.canvasOffset = { x: 0, y: 0 }
    this.emit('cleared', null)
  }

  getSelectedElement(): BaseElement | null {
    if (!this.selectedElementId) return null
    return this.getElementById(this.selectedElementId) || null
  }

  setTool(tool: string): void {
    this.currentTool = tool
    this.emit('toolChanged', tool)
  }

  setSelectedSprite(spriteId: string | null): void {
    this.selectedSprite = spriteId
  }

  sortElementsByZIndex(): void {
    this.elements.sort((a, b) => a.data.zIndex - b.data.zIndex)
  }
}