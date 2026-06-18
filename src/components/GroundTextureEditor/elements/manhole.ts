import { BaseElementDefinition } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'

class ManholeClass extends SpriteElement<SpriteElementData> {
  texture = '⭕️'
  color = '#4a4a4a'
}

export const manholeDefinition: BaseElementDefinition = {
  id: 'manhole',
  name: '井盖',
  icon: '⭕️',
  type: 'sprite',
  createClass: ManholeClass
}
