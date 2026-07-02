import { ConeEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const ConePlugin: PluginType = {
  name: '圆锥体',
  key: 'cone',
  type: 'base',
  entity: ConeEntity,
  objType: 'point',
  previewImg: '/toolType/cone.png',
  defaultValues,
}
export default ConePlugin
