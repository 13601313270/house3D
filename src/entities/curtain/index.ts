import { CurtainEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const CurtainPlugin: PluginType = {
  name: '垂直方形幕布',
  key: 'curtain',
  type: 'curtain',
  entity: CurtainEntity,
  objType: 'point',
  previewImg: '/toolType/curtain.png',
  defaultValues,
}
export default CurtainPlugin
