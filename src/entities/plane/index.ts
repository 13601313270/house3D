import { PlaneEntity } from "./entity"
import PluginType from "../pluginType"

const PlanePlugin: PluginType = {
  name: '平面',
  key: 'plane',
  type: 'base',
  entity: PlaneEntity,
  objType: 'point',
}
export default PlanePlugin
