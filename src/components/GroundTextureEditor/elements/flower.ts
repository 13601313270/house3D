import { BaseElementDefinition } from '../types'
import { FlowerClass } from './flowerClass'

export class FlowerDefinition extends BaseElementDefinition {
  id = 'flower'
  name = '花坛'
  icon = '🌸'
  type = 'sprite' as const
  createClass = FlowerClass
}

export const flowerDefinition = new FlowerDefinition()