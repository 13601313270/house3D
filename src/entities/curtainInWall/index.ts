import { CurtainInWallEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const CurtainInWallPlugin: PluginType = {
  name: '方形幕布(挂在墙上)',
  key: 'curtainInWall',
  type: 'curtain',
  entity: CurtainInWallEntity,
  objType: 'point',
  defaultValues,
  previewImg: '/toolType/curtainInWall.png',
}
export default CurtainInWallPlugin
