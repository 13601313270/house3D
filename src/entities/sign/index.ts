import { SignEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"
// @ts-ignore
import signImg from './sign.jpg'

const SignPlugin: PluginType = {
  name: '交通标识',
  key: 'sign',
  type: 10,
  entity: SignEntity,
  objType: 'point',
  previewImg: signImg,
  defaultValues,
}
export default SignPlugin
