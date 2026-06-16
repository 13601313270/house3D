import { StaircaseEntity } from "./entity"
import PluginType from "../pluginType"

const staircasePlugin: PluginType = {
  name: '楼梯/台阶',
  key: 'staircase',
  type: 'house',
  entity: StaircaseEntity,
  objType: 'polyline',
}
export default staircasePlugin
