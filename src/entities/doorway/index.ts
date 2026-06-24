import { DoorEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const DoorwayPlugin: PluginType = {
  name: '门洞',
  key: 'doorway',
  type: 'house',
  entity: DoorEntity,
  objType: 'point',
  defaultValues,
}
export default DoorwayPlugin
