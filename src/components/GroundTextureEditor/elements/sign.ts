import { BaseElementDefinition } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'

class SignClass extends SpriteElement<SpriteElementData> {
  type = 'sign'
  texture = '⚠️'
  color = '#FFFF00'
  ratioLocked = false
  defaultWidth = 30
  defaultHeight = 40
}
export const signDefinition: BaseElementDefinition = {
  id: 'sign',
  name: '警示牌',
  icon: '⚠️',
  type: 'sprite',
  createClass: SignClass
}
