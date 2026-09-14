import { SectorEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const SectorPlugin: PluginType = {
  name: '扇形体',
  enName: 'Sector Solid',
  key: 'sector',
  type: 'base',
  entity: SectorEntity,
  objType: 'point',
  previewImg: '/toolType/sector.png',
  defaultValues,
}
export default SectorPlugin
