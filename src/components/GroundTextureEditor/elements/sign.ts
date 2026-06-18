import { BaseElementDefinition } from '../types'
import { SpriteElement, SpriteElementData } from '../types/spriteElement'

class SignClass extends SpriteElement<SpriteElementData> {
  texture = '⚠️'
  color = '#FFFF00'
}
export const signDefinition: BaseElementDefinition = {
  id: 'sign',
  name: '警示牌',
  icon: '⚠️',
  type: 'sprite' as const,
  createClass: SignClass
}
