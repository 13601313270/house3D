import { PeopleEntity } from "./entity"
import PluginType from "../pluginType"
import defaultValues from "./defaultValues"

const PeoplePlugin: PluginType = {
  name: '人物',
  key: 'people',
  type: 'other',
  entity: PeopleEntity,
  objType: 'point',
  previewImg: '/toolType/people.png',
  defaultValues,
}
export default PeoplePlugin
