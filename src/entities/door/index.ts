import { DoorEntity } from "./entity"
import PluginType from "../pluginType"

const doorPlugin: PluginType = {
  name: '门',
  key: 'door',
  type: 'house',
  entity: DoorEntity,
  objType: 'point',
}
export default doorPlugin