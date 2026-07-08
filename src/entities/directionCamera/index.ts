import { DirectionCameraEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const DirectionCameraPlugin: PluginType = {
  name: '相机(相机位置+方向)',
  key: 'directionCamera',
  type: 'camera',
  entity: DirectionCameraEntity,
  objType: 'point',
  defaultValues,
}
export default DirectionCameraPlugin
