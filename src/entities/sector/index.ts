import { SectorEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const SectorPlugin: PluginType = {
  name: '扇形体',
  key: 'sector',
  type: 'base',
  entity: SectorEntity,
  objType: 'point',
  previewImg: '/toolType/sector2.png',
  defaultValues,
}
export default SectorPlugin
