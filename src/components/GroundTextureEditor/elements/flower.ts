import { BaseElementDefinition } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'

class FlowerClass extends SpriteElement<SpriteElementData> {
  texture = '🌹'
}

export const flowerDefinition: BaseElementDefinition = {
  id: 'flower',
  name: '花坛',
  icon: '🌸',
  type: 'sprite',
  createClass: FlowerClass,
}
