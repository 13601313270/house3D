import { SignEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const SignPlugin: PluginType = {
  name: '交通标识',
  key: 'sign',
  type: 'other',
  entity: SignEntity,
  objType: 'point',
  defaultValues,
}
export default SignPlugin
