import type { BaseElement, BaseElementData } from './baseElement'
import type { TextureWorld } from '../world'
import type { ElementType } from './index'

export type ElementCreator = (world: TextureWorld, data: any) => BaseElement<BaseElementData>

export class ElementFactory {
  private static creators: Partial<Record<ElementType, ElementCreator>> = {}

  static register(type: ElementType, creator: ElementCreator): void {
    ElementFactory.creators[type] = creator
  }

  static create(type: ElementType, world: TextureWorld, data: any): BaseElement<BaseElementData> | null {
    const creator = ElementFactory.creators[type]
    return creator ? creator(world, data) : null
  }
}