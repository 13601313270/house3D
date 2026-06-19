import { BaseElementDefinition } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'

class LampClass extends SpriteElement<SpriteElementData> {
  type = 'lamp'
  texture = '💡'
  color = '#FFD700'
  ratioLocked = false
  defaultWidth = 30
  defaultHeight = 40
}

export const lampDefinition: BaseElementDefinition = {
  id: 'lamp',
  name: '路灯',
  icon: '💡',
  type: 'sprite',
  createClass: LampClass
}
