import { RegularPolygonEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const RegularPolygonPlugin: PluginType = {
  name: 'N边形体',
  key: 'regularPolygon',
  type: 'base',
  entity: RegularPolygonEntity,
  objType: 'point',
  previewImg: '/toolType/regularPolygon.png',
  defaultValues,
}
export default RegularPolygonPlugin
