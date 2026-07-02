import { CubeEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const CubePlugin: PluginType = {
  name: '方块',
  key: 'cube',
  type: 'base',
  entity: CubeEntity,
  objType: 'point',
  previewImg: '/toolType/cube.png',
  defaultValues,
}
export default CubePlugin
