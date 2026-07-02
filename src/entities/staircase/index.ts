import { StaircaseEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const staircasePlugin: PluginType = {
  name: '楼梯/台阶',
  key: 'staircase',
  type: 'house',
  entity: StaircaseEntity,
  objType: 'polyline',
  defaultValues,
  previewImg: '/toolType/staircase.png',
}
export default staircasePlugin
