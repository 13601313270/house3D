import { WindowEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const windowPlugin: PluginType = {
  name: '窗户',
  key: 'window',
  type: 'house',
  entity: WindowEntity,
  objType: 'point',
  defaultValues,
}
export default windowPlugin