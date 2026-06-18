import type { Point, ElementType } from './types'
import { BaseElement } from './types'
import { ElementRegistry } from './elements/registry'
import { ElementFactory } from './types/elementFactory'

// 导入元素类以触发注册
import './types/spriteElement'
import './types/polylineElement'
import './types/polygonElement'

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

  get spriteLibrary() {
    return ElementRegistry.getAll()
  }

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

    const definition = spriteId ? ElementRegistry.getById(spriteId) : null
    const color = definition?.color || '#333333'
    const width = definition?.defaultWidth || 20

    let config: any
    switch (type) {
      case 'sprite':
        config = {
          id,
          x: 0,
          y: 0,
          width: definition?.defaultWidth || 50,
          height: definition?.defaultHeight || 50,
          rotation: 0,
          texture: definition?.id || 'manhole',
          name: definition?.name || 'Sprite',
          opacity: 1,
          zIndex: this.elements.length,
        }
        break
      case 'polyline':
        config = {
          id,
          points: [],
          width,
          texture: definition?.id || 'road',
          color,
          opacity: 1,
          zIndex: this.elements.length,
        }
        break
      case 'polygon':
        config = {
          id,
          points: [],
          texture: definition?.id || 'grass',
          color,
          textureScale: 1,
          opacity: 1,
          zIndex: this.elements.length,
        }
        break
      default:
        config = null
    }

    if (config) {
      this.drawingElement = ElementFactory.create(type, this, config)
    }
  }

  addDrawingPoint(pos: Point): void {
    if (this.drawingElement) {
      this.drawingElement.handleMouseDown(pos)
    }
  }

  finishDrawing(): boolean {
    if (!this.drawingElement) {
      this.isDrawing = false
      this.selectedSprite = null
      return false
    }

    if (this.drawingElement.canFinishDrawing()) {
      this.addElement(this.drawingElement)
      this.selectElement(this.drawingElement.data.id)
      this.drawingElement = null
      this.isDrawing = false
      this.selectedSprite = null
      return true
    }

    this.drawingElement = null
    this.isDrawing = false
    this.selectedSprite = null
    return false
  }

  cancelDrawing(): void {
    this.drawingElement = null
    this.isDrawing = false
    this.selectedSprite = null
  }

  createSprite(pos: Point, spriteId: string): SpriteElement | null {
    const definition = ElementRegistry.getById(spriteId)
    if (!definition) return null

    const element = new SpriteElement(this, {
      id: Date.now().toString(),
      x: pos.x,
      y: pos.y,
      width: definition.defaultWidth || 60,
      height: definition.defaultHeight || 60,
      rotation: 0,
      texture: definition.id,
      opacity: 1,
      zIndex: this.elements.length,
      name: definition.name,
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

  exportElements(): any[] {
    return this.elements.map((element) => ({
      type: element.type,
      data: { ...element.data },
    }))
  }

  importElements(data: any[]): void {
    this.elements = []
    this.selectedElementId = null

    data.forEach((item) => {
      const type = item.type as ElementType
      const element = ElementFactory.create(type, this, item.data)
      if (element) {
        this.elements.push(element)
      }
    })
  }
}