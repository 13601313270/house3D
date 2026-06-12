import { CurtainInWallEntity } from "./entity"
import PluginType from "../pluginType"

const curtainInWallPlugin: PluginType = {
  name: '方形幕布(挂在墙上)',
  key: 'curtainInWall',
  type: 'curtain',
  entity: CurtainInWallEntity,
  objType: 'point',
}
export default curtainInWallPlugin
