import type { BaseElement } from './baseElement'
import type { TextureWorld } from '../world'
import type { ElementType } from './index'

export type ElementCreator = (world: TextureWorld, data: any) => BaseElement

export class ElementFactory {
  private static creators: Record<ElementType, ElementCreator> = {}

  static register(type: ElementType, creator: ElementCreator): void {
    ElementFactory.creators[type] = creator
  }

  static create(type: ElementType, world: TextureWorld, data: any): BaseElement | null {
    const creator = ElementFactory.creators[type]
    return creator ? creator(world, data) : null
  }
}