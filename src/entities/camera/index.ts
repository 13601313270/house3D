import { CameraEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const CameraPlugin: PluginType = {
  name: '相机 (相机位置+目标位置)',
  key: 'camera',
  type: 'camera',
  entity: CameraEntity,
  objType: 'point',
  defaultValues,
}
export default CameraPlugin
