import { PointGroupEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const PointGroupPlugin: PluginType = {
  name: '组',
  key: 'pointGroup',
  type: 'other',
  entity: PointGroupEntity,
  objType: 'point',
  previewImg: '/toolType/group.png',
  defaultValues,
}
export default PointGroupPlugin
