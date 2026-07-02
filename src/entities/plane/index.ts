import { PlaneEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const PlanePlugin: PluginType = {
  name: '方形平面',
  key: 'plane',
  type: 'base',
  entity: PlaneEntity,
  objType: 'point',
  previewImg: '/toolType/plane.png',
  defaultValues,
}
export default PlanePlugin
