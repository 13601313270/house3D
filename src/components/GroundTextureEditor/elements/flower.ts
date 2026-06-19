import { BaseElementDefinition } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'

class FlowerClass extends SpriteElement<SpriteElementData> {
  type = 'flower'
  texture = '🌹'
  ratioLocked = true
  defaultWidth = 50
  defaultHeight = 50
}

export const flowerDefinition: BaseElementDefinition = {
  id: 'flower',
  name: '花坛',
  icon: '🌸',
  type: 'sprite',
  createClass: FlowerClass,
}
