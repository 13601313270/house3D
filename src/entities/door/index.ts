import { DoorEntity } from "./entity"
import PluginType from "../pluginType"

const doorPlugin: PluginType = {
  name: '门',
  key: 'door',
  type: 'other',
  entity: DoorEntity,
}
export default doorPlugin