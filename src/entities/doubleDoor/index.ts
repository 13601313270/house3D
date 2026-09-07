import { DoubleDoorEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const DoubleDoorPlugin: PluginType = {
  name: '对开门',
  key: 'doubleDoor',
  type: 'house',
  entity: DoubleDoorEntity,
  objType: 'point',
  defaultValues,
  previewImg: '/toolType/doubleDoor.png',
}
export default DoubleDoorPlugin
