import type { ElementDefinition } from '../types'

export class ElementRegistry {
  private static definitions: ElementDefinition[] = []

  static register(definition: ElementDefinition): void {
    ElementRegistry.definitions.push(definition)
  }

  static getAll(): ElementDefinition[] {
    return [...ElementRegistry.definitions]
  }

  static getById(id: string): ElementDefinition | undefined {
    return ElementRegistry.definitions.find((d) => d.id === id)
  }

  static getByType(type: string): ElementDefinition[] {
    return ElementRegistry.definitions.filter((d) => d.type === type)
  }
}

import { manholeDefinition } from './manhole'
import { grassDefinition } from './grass'
import { tileDefinition } from './tile'
import { signDefinition } from './sign'
import { lampDefinition } from './lamp'
import { roadDefinition } from './road'
import { crosswalkDefinition } from './crosswalk'
import { flowerDefinition } from './flower'

ElementRegistry.register(manholeDefinition)
ElementRegistry.register(grassDefinition)
ElementRegistry.register(tileDefinition)
ElementRegistry.register(signDefinition)
ElementRegistry.register(lampDefinition)
ElementRegistry.register(roadDefinition)
ElementRegistry.register(crosswalkDefinition)
ElementRegistry.register(flowerDefinition)