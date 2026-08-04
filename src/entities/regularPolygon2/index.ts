import { RegularPolygon2Entity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const RegularPolygonPlugin: PluginType = {
  name: 'N边形锥',
  key: 'regularPolygon2',
  type: 'base',
  entity: RegularPolygon2Entity,
  objType: 'point',
  previewImg: '/toolType/regularPolygon2.png',
  defaultValues,
}
export default RegularPolygonPlugin
