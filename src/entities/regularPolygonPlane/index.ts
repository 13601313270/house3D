import { RegularPolygonPlaneEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const RegularPolygonPlanePlugin: PluginType = {
  name: 'N边形体',
  key: 'regularPolygonPlane',
  type: 'base',
  entity: RegularPolygonPlaneEntity,
  objType: 'point',
  previewImg: '/toolType/regularPolygonPlane.png',
  defaultValues,
}
export default RegularPolygonPlanePlugin
