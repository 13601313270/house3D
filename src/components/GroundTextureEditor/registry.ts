import type { BaseElementDefinition } from './types'
import { manholeDefinition } from './TextureElements/manhole'
import { grassDefinition } from './TextureElements/grass'
import { tileDefinition } from './TextureElements/tile'
import { signDefinition } from './TextureElements/sign'
import { roadDefinition } from './TextureElements/road'
import { crosswalkDefinition } from './TextureElements/crosswalk'
import { flowerDefinition } from './TextureElements/flower'
import { textDefinition } from './TextureElements/text'
import { lineDefinition } from './TextureElements/line'
import { circleDefinition } from './TextureElements/circle'
import { rectDefinition } from './TextureElements/rect'

export class ElementRegistry {
  static mapIdToDefinition: Map<string, BaseElementDefinition> = new Map()
  private static definitions: BaseElementDefinition[] = []

  static register(definition: BaseElementDefinition): void {
    this.mapIdToDefinition.set(definition.id, definition)
    ElementRegistry.definitions.push(definition)
  }

  static getAll(): BaseElementDefinition[] {
    return [...ElementRegistry.definitions]
  }

  static getById(id: string): BaseElementDefinition | undefined {
    return ElementRegistry.definitions.find((d) => d.id === id)
  }

  static getByType(type: string): BaseElementDefinition[] {
    return ElementRegistry.definitions.filter((d) => d.type === type)
  }
}

ElementRegistry.register(manholeDefinition)
ElementRegistry.register(grassDefinition)
ElementRegistry.register(tileDefinition)
ElementRegistry.register(signDefinition)
ElementRegistry.register(roadDefinition)
ElementRegistry.register(crosswalkDefinition)
ElementRegistry.register(flowerDefinition)
ElementRegistry.register(textDefinition)
ElementRegistry.register(lineDefinition)
ElementRegistry.register(circleDefinition)
ElementRegistry.register(rectDefinition)
