import { SignEntity } from "./entity"
import PluginType from "../pluginType"

const SignPlugin: PluginType = {
  name: '交通标识',
  key: 'sign',
  type: 'other',
  entity: SignEntity,
  objType: 'point',
}
export default SignPlugin
