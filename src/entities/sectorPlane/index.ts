import { SectorPlaneEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const SectorPlugin: PluginType = {
  name: '扇形平面',
  key: 'sectorPlane',
  type: 'base',
  entity: SectorPlaneEntity,
  objType: 'point',
  previewImg: '/toolType/sectorPlane.png',
  defaultValues,
}
export default SectorPlugin
