import { WallEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const wallPlugin: PluginType = {
  name: '墙体',
  key: 'wall',
  type: 'house',
  entity: WallEntity,
  objType: 'polyline',
  defaultValues,
}
export default wallPlugin