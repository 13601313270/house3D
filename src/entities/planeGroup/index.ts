import { PlaneGroupEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const GroupPlugin: PluginType = {
  name: '组',
  key: 'planeGroup',
  type: 'other',
  entity: PlaneGroupEntity,
  objType: 'point',
  previewImg: '/toolType/group.png',
  defaultValues,
}
export default GroupPlugin
