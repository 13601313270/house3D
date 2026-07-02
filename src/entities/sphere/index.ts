import { SphereEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const spherePlugin: PluginType = {
  name: '球体',
  key: 'sphere',
  type: 'base',
  entity: SphereEntity,
  objType: 'point',
  previewImg: '/toolType/sphere.png',
  defaultValues,
}
export default spherePlugin