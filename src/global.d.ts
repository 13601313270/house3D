import WorldGroup from '@/world/world'
import WorldState from './utils/worldState'
import { GroupBaseEntity } from '@/types/groupBase/entity'
import { GroupBaseData } from '@/types/groupBase/index.d'
import { Keyframe } from '@/utils/timelineState';

declare global {
  interface Window {
    worldApi: WorldGroup
    worldState: WorldState
    globalEditGroup: GroupBaseEntity<GroupBaseData> // 全局正在编辑状态的组
    activeKeyFrameNode: Keyframe,
  }
}
