import { DoorEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const DoorPlugin: PluginType = {
  name: '门',
  key: 'door',
  type: 'house',
  entity: DoorEntity,
  objType: 'point',
  defaultValues,
  previewImg: '/toolType/door.png',
}
export default DoorPlugin
