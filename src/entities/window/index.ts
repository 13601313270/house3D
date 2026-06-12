import { WindowEntity } from "./entity"
import PluginType from "../pluginType"

const windowPlugin: PluginType = {
  name: '窗户',
  key: 'window',
  type: 'house',
  entity: WindowEntity,
  objType: 'point',
}
export default windowPlugin