import PluginType from "../pluginType"
import { ImportFileEntity } from "./entity"

const importFilePlugin: PluginType = {
  name: '导入模型文件',
  key: 'importFile',
  type: 'other',
  entity: ImportFileEntity,
  objType: 'point',
}
export default importFilePlugin
