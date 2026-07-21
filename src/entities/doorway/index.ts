import { DoorEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const DoorwayPlugin: PluginType = {
  name: '洞',
  key: 'doorway',
  type: 'house',
  entity: DoorEntity,
  objType: 'point',
  defaultValues,
  previewImg: '/toolType/doorway.png',
}
export default DoorwayPlugin
