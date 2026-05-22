import { CubeEntity } from "./entity"
import PluginType from "../pluginType"

const cubePlugin: PluginType = {
  name: '方块',
  key: 'cube',
  type: 'base',
  entity: CubeEntity,
}
export default cubePlugin