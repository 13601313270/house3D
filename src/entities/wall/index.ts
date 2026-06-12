import { WallEntity } from "./entity"
import PluginType from "../pluginType"

const wallPlugin: PluginType = {
  name: '墙体',
  key: 'wall',
  type: 'house',
  entity: WallEntity,
  objType: 'polyline',
}
export default wallPlugin