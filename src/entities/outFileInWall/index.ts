import { OutFileInWallEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const OutFileInWallPlugin: PluginType = {
  name: '外部文件(墙上)',
  key: 'outFileInWall',
  type: 'other',
  entity: OutFileInWallEntity,
  objType: 'point',
  defaultValues,
}
export default OutFileInWallPlugin
