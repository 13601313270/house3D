import { DoorWayEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const DoorwayPlugin: PluginType = {
  name: '洞',
  enName: 'Doorway',
  key: 'doorway',
  type: 'house',
  entity: DoorWayEntity,
  objType: 'point',
  defaultValues,
  previewImg: '/toolType/doorway.png',
}
export default DoorwayPlugin
