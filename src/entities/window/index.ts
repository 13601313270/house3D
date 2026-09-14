import { WindowEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const windowPlugin: PluginType = {
  name: '窗户',
  enName: 'Window',
  key: 'window',
  type: 'house',
  entity: WindowEntity,
  objType: 'point',
  defaultValues,
  previewImg: '/toolType/window.png',
}
export default windowPlugin