import { CurtainEntity } from "./entity"
import PluginType from "../pluginType"

const CurtainPlugin: PluginType = {
  name: '垂直方形幕布',
  key: 'curtain',
  type: 'curtain',
  entity: CurtainEntity,
  objType: 'point',
}
export default CurtainPlugin
