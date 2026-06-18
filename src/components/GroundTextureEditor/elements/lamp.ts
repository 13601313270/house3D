import { BaseElementDefinition } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'

class LampClass extends SpriteElement<SpriteElementData> {
  texture = '💡'
  color = '#FFD700'
}

export const lampDefinition: BaseElementDefinition = {
  id: 'lamp',
  name: '路灯',
  icon: '💡',
  type: 'sprite',
  createClass: LampClass
}
