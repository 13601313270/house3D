import { SignEntity } from "./entity"
import PluginType from "../pluginType"

const SignPlugin: PluginType = {
  name: '标志',
  key: 'sign',
  type: 'other',
  entity: SignEntity,
  objType: 'point',
}
export default SignPlugin
