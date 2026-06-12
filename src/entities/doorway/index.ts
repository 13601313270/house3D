import { DoorEntity } from "./entity"
import PluginType from "../pluginType"

const doorPlugin: PluginType = {
  name: '门洞',
  key: 'doorway',
  type: 'house',
  entity: DoorEntity,
}
export default doorPlugin