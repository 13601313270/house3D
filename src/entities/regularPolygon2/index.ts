import { RegularPolygonEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const RegularPolygonPlugin: PluginType = {
  name: 'N边形锥',
  key: 'regularPolygon2',
  type: 'base',
  entity: RegularPolygonEntity,
  objType: 'point',
  previewImg: '/toolType/regularPolygon2.png',
  defaultValues,
}
export default RegularPolygonPlugin
