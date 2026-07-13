import { Group } from './entities/Group/entity'
import WorldState from './utils/worldState'

declare global {
  interface Window {
    worldApi: Group
    worldState: WorldState
  }
}
