import { TorusEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const TorusPlugin: PluginType = {
  name: '环体',
  key: 'torus',
  type: 'base',
  entity: TorusEntity,
  objType: 'point',
  previewImg: '/toolType/torus.png',
  defaultValues,
}
export default TorusPlugin
