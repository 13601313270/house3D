import { PolygonPlaneEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const polygonPlanePlugin: PluginType = {
  name: '折线平面',
  key: 'polygonPlane',
  type: 'base',
  entity: PolygonPlaneEntity,
  objType: 'polyline',
  previewImg: '/toolType/polygonPlane.png',
  defaultValues,
}
export default polygonPlanePlugin
