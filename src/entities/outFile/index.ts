import { OutFileEntity } from "./entity"
import PluginType from "../pluginType"

const outFilePlugin: PluginType = {
  name: '外部文件',
  key: 'outFile',
  type: 'other',
  entity: OutFileEntity,
  objType: 'point',
}
export default outFilePlugin