import type { Point, ElementType, BaseElementData, BaseElementDefinition } from './types'
import { BaseElement } from './types'
import { ElementRegistry } from './registry'
import { SpriteElement } from './types/spriteElement'

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
    // 自动分配 zIndex，确保新元素在最上层
    const maxZIndex = this.elements.length > 0
      ? Math.max(...this.elements.map(e => e.data.zIndex))
      : -1
    element.data.zIndex = maxZIndex + 1
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

  async setSelectedSprite(spriteId: BaseElementDefinition): Promise<void> {
    this.selectedSprite = spriteId
    const CreateClass = this.selectedSprite.createClass
    const defaultData = CreateClass.defaultData()
    this.drawingElement = new CreateClass(this, defaultData);

    // 如果是 SpriteElement，使用子类定义的默认宽高
    if (this.drawingElement instanceof SpriteElement) {
      const sprite = this.drawingElement as SpriteElement<any>
      sprite.data.width = sprite.defaultWidth
      sprite.data.height = sprite.defaultHeight
    }

    // 调用异步初始化方法
    await this.drawingElement.init()
    this.isDrawing = true
  }

  sortElementsByZIndex(): void {
    this.elements.sort((a, b) => a.data.zIndex - b.data.zIndex)
  }

  // 向上移动一层（与最近的上一层元素交换 zIndex）
  bringForward(): void {
    if (!this.selectedElementId) return
    const element = this.getElementById(this.selectedElementId)
    if (!element) return

    const currentZIndex = element.data.zIndex

    // 找出 zIndex 大于当前元素且最接近的元素
    const aboveElements = this.elements
      .filter(e => e.data.zIndex > currentZIndex)
      .sort((a, b) => a.data.zIndex - b.data.zIndex)

    if (aboveElements.length > 0) {
      const swapTarget = aboveElements[0]
      const targetZIndex = swapTarget.data.zIndex
      swapTarget.data.zIndex = currentZIndex
      element.data.zIndex = targetZIndex
      this.sortElementsByZIndex()
      this.emit('elementUpdated', element.data.id)
    }
  }

  // 向下移动一层（与最近的下一层元素交换 zIndex）
  sendBackward(): void {
    if (!this.selectedElementId) return
    const element = this.getElementById(this.selectedElementId)
    if (!element) return

    const currentZIndex = element.data.zIndex

    // 找出 zIndex 小于当前元素且最接近的元素
    const belowElements = this.elements
      .filter(e => e.data.zIndex < currentZIndex)
      .sort((a, b) => b.data.zIndex - a.data.zIndex)

    if (belowElements.length > 0) {
      const swapTarget = belowElements[0]
      const targetZIndex = swapTarget.data.zIndex
      swapTarget.data.zIndex = currentZIndex
      element.data.zIndex = targetZIndex
      this.sortElementsByZIndex()
      this.emit('elementUpdated', element.data.id)
    }
  }

  // 移动到最顶层
  bringToFront(): void {
    if (!this.selectedElementId) return
    const element = this.getElementById(this.selectedElementId)
    if (!element) return

    const maxZIndex = Math.max(...this.elements.map(e => e.data.zIndex))
    if (element.data.zIndex < maxZIndex) {
      element.data.zIndex = maxZIndex + 1
      this.sortElementsByZIndex()
      this.emit('elementUpdated', element.data.id)
    }
  }

  // 移动到最底层
  sendToBack(): void {
    if (!this.selectedElementId) return
    const element = this.getElementById(this.selectedElementId)
    if (!element) return

    const minZIndex = Math.min(...this.elements.map(e => e.data.zIndex))
    if (element.data.zIndex > minZIndex) {
      element.data.zIndex = minZIndex - 1
      this.sortElementsByZIndex()
      this.emit('elementUpdated', element.data.id)
    }
  }

  // 重新分配所有元素的 zIndex（按当前顺序从 0 开始编号）
  reindexZIndex(): void {
    this.elements.forEach((element, index) => {
      element.data.zIndex = index
    })
    this.emit('elementsReindexed', null)
  }

  exportElements(): any[] {
    return this.elements.map((element) => ({
      type: element.type,
      data: { ...element.data },
    }))
  }

  async importElements(data: any[]): Promise<void> {
    this.elements = []
    this.selectedElementId = null

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      const type = item.type as ElementType
      const option = ElementRegistry.mapIdToDefinition.get(type)
      if (option) {
        const ClassName = option.createClass
        const defaultData = ClassName.defaultData()
        const itemData = item.data || {}
        const mergedData = { ...defaultData, ...itemData }
        const element = new ClassName(this, mergedData)
        await element.init()
        this.elements.push(element)
      }
    }
    this.reindexZIndex()
  }
}