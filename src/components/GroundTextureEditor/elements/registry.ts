import type { BaseElementDefinition } from '../types'
// import { manholeDefinition } from './manhole'
import { grassDefinition } from './grass'
// import { tileDefinition } from './tile.ts.bac'
// import { signDefinition } from './sign.ts.bac'
// import { lampDefinition } from './lamp.ts.bac'
import { roadDefinition } from './road'
// import { crosswalkDefinition } from './crosswalk.ts.bac'
import { flowerDefinition } from './flower'

export class ElementRegistry {
  private static definitions: BaseElementDefinition[] = []

  static register(definition: BaseElementDefinition): void {
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

// ElementRegistry.register(manholeDefinition)
ElementRegistry.register(grassDefinition)
// ElementRegistry.register(tileDefinition)
// ElementRegistry.register(signDefinition)
// ElementRegistry.register(lampDefinition)
ElementRegistry.register(roadDefinition)
// ElementRegistry.register(crosswalkDefinition)
ElementRegistry.register(flowerDefinition)