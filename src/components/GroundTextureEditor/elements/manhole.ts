import { BaseElementDefinition } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'

class ManholeClass extends SpriteElement<SpriteElementData> {
  type = 'manhole'
  texture = '/sticker/manhole.png'
  color = '#4a4a4a'
  ratioLocked = true
  defaultWidth = 70
  defaultHeight = 70
}

export const manholeDefinition: BaseElementDefinition = {
  id: 'manhole',
  name: '井盖',
  icon: '⭕️',
  type: 'sprite',
  createClass: ManholeClass
}
