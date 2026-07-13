import { Group } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const GroupPlugin: PluginType = {
  name: '组',
  key: 'group',
  type: 'base',
  entity: Group,
  objType: 'point',
  previewImg: '/toolType/group.png',
  defaultValues,
}
export default GroupPlugin
