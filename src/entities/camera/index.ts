import { CameraEntity } from "./entity"
import PluginType from "../pluginType"

const cameraPlugin: PluginType = {
  name: '相机',
  key: 'camera',
  type: 'other',
  entity: CameraEntity,
  objType: 'point',
}
export default cameraPlugin