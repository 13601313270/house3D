import { PolygonEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const polygonPlugin: PluginType = {
  name: '折线体',
  key: 'polygon',
  type: 'base',
  entity: PolygonEntity,
  objType: 'polyline',
  previewImg: '/toolType/polygon.png',
  defaultValues,
}
export default polygonPlugin
