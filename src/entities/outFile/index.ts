import { OutFileEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const OutFilePlugin: PluginType = {
  name: '外部文件',
  key: 'outFile',
  type: 'other',
  entity: OutFileEntity,
  objType: 'point',
  defaultValues,
}
export default OutFilePlugin
