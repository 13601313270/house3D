import { World } from './utils/world/entity'
import WorldState from './utils/worldState'

declare global {
  interface Window {
    worldApi: World
    worldState: WorldState
  }
}
