import { ConeEntity } from "./entity"
import PluginType from "../pluginType"

const ConePlugin: PluginType = {
  name: '圆锥体',
  key: 'cone',
  type: 'base',
  entity: ConeEntity,
  objType: 'point',
}
export default ConePlugin
