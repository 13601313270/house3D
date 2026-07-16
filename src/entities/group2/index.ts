import { GroupEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const GroupPlugin: PluginType = {
  name: '组',
  key: 'group',
  type: 'other',
  entity: GroupEntity,
  objType: 'point',
  previewImg: '/toolType/group.png',
  defaultValues,
}
export default GroupPlugin
