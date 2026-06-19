import type { BaseElementDefinition } from './types'
import { manholeDefinition } from './elements/manhole'
import { grassDefinition } from './elements/grass'
import { tileDefinition } from './elements/tile'
import { signDefinition } from './elements/sign'
import { lampDefinition } from './elements/lamp'
import { roadDefinition } from './elements/road'
import { crosswalkDefinition } from './elements/crosswalk'
import { flowerDefinition } from './elements/flower'

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
ElementRegistry.register(lampDefinition)
ElementRegistry.register(roadDefinition)
ElementRegistry.register(crosswalkDefinition)
ElementRegistry.register(flowerDefinition)