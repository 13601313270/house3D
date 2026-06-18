import { BaseElementDefinition } from '../types'

export class FlowerDefinition extends BaseElementDefinition {
  id = 'flower'
  name = '花坛'
  icon = '🌸'
  type = 'sprite' as const
  drawType = 'sprite' as const
  color = '#FF69B4'
  defaultWidth = 50
  defaultHeight = 50
}

export const flowerDefinition = new FlowerDefinition()