import PluginType from "../pluginType"
import { ImportFileEntity } from "./entity"
import defaultValues from "./defaultValues"

const ImportFilePlugin: PluginType = {
  name: '导入模型文件',
  key: 'importFile',
  type: 'other',
  entity: ImportFileEntity,
  objType: 'point',
  defaultValues,
}
export default ImportFilePlugin
