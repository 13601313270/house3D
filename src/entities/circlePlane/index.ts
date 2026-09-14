import { CirclePlaneEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const CirclePlanePlugin: PluginType = {
  name: '圆形平面',
  enName: 'Circular Plane',
  key: 'circlePlane',
  type: 'base',
  entity: CirclePlaneEntity,
  objType: 'point',
  previewImg: '/toolType/circlePlane.png',
  defaultValues,
}
export default CirclePlanePlugin
