import { PeopleEntity } from "./entity"
import PluginType from "../pluginType"

const cameraPlugin: PluginType = {
  name: '人物',
  key: 'people',
  type: 'other',
  entity: PeopleEntity,
}
export default cameraPlugin