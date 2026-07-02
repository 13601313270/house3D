import { CylinderEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const CylinderPlugin: PluginType = {
  name: '圆柱体',
  key: 'cylinder',
  type: 'base',
  entity: CylinderEntity,
  objType: 'point',
  previewImg: '/toolType/cylinder.png',
  defaultValues,
}
export default CylinderPlugin
