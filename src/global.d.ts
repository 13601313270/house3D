import { GroupEntity } from './entities/group/entity'
import WorldState from './utils/worldState'

declare global {
  interface Window {
    worldApi: GroupEntity
    worldState: WorldState
  }
}
