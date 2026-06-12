import { DoorEntity } from "./entity"
import PluginType from "../pluginType"

const doorPlugin: PluginType = {
  name: '门洞',
  key: 'doorway',
  type: 'house',
  entity: DoorEntity,
  objType: 'point',
}
export default doorPlugin