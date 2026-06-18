import type { Point, ElementType, BaseElementData, BaseElementDefinition } from './types'
import { BaseElement } from './types'
import { ElementRegistry } from './registry'
import { ElementFactory } from './types/elementFactory'

// 导入元素类以触发注册
import './types/spriteElement'
import './types/polylineElement'
import './types/polygonElement'

export class TextureWorld {
  elements: BaseElement<BaseElementData>[] = []
  selectedElementId: string | null = null
  currentTool: string = 'select'
  selectedSprite: BaseElementDefinition | null = null
  isDrawing: boolean = false
  isDragging: boolean = false
  isPanning: boolean = false
  canvasOffset: Point = { x: 0, y: 0 }
  scale: number = 1
  dragOffset: Point = { x: 0, y: 0 }
  panStartPos: Point = { x: 0, y: 0 }
  panStartOffset: Point = { x: 0, y: 0 }
  drawingElement: BaseElement<BaseElementData> | null = null
  lastClickTime: number = 0

  get spriteLibrary(): BaseElementDefinition[] {
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

  addElement(element: BaseElement<BaseElementData>): void {
    this.elements.push(element)
    this.emit('elementAdded', element)
  }

  removeElement(element: BaseElement<BaseElementData>): void {
    const index = this.elements.findIndex((e) => e.data.id === element.data.id)
    if (index !== -1) {
      this.elements.splice(index, 1)
      if (this.selectedElementId === element.data.id) {
        this.selectedElementId = null
      }
      this.emit('elementRemoved', element)
    }
  }

  getElementById(id: string): BaseElement<BaseElementData> | undefined {
    return this.elements.find((e) => e.data.id === id)
  }

  selectElement(id: string | null): void {
    this.selectedElementId = id
    this.emit('selectionChanged', id)
  }

  findElementAt(pos: Point): BaseElement<BaseElementData> | null {
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const element = this.elements[i]
      if (element.containsPoint(pos)) {
        return element
      }
    }
    return null
  }

  startDrawing(): void {
    if (this.selectedSprite) {
      this.isDrawing = true
      const CreateClass = this.selectedSprite.createClass
      const defaultData = CreateClass.defaultData()
      this.drawingElement = new CreateClass(this, defaultData);
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

  getSelectedElement(): BaseElement<BaseElementData> | null {
    if (!this.selectedElementId) return null
    return this.getElementById(this.selectedElementId) || null
  }

  setTool(tool: string): void {
    this.currentTool = tool
    this.emit('toolChanged', tool)
  }

  setSelectedSprite(spriteId: BaseElementDefinition): void {
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