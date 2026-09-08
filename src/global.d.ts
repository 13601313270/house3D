import WorldGroup from '@/world/world'
import WorldState from './utils/worldState'
import { GroupBaseEntity } from '@/types/groupBase/entity'
import { GroupBaseData } from '@/types/groupBase/index.d'
import { BaseEntityClass } from '@/types/baseEntity'
import { BaseObjData } from '@/types/map2d'
import Canvas2DScene from '@/utils/canvas2DScene';

declare global {
  interface Window {
    worldApi: WorldGroup
    worldState: WorldState
    showLoginDialog: () => void,// 弹出登陆窗口
    scene2D: Canvas2DScene
    editPropEntity: BaseEntityClass<BaseObjData>// 正在右键调整属性的对象
    globalEditGroup: GroupBaseEntity<GroupBaseData> // 全局正在编辑状态的组
    gtag: (type: 'event', action: string, option?: any) => any,
  }
}
