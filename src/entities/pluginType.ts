import { BaseEntityClass } from "@/types/baseEntity";

type EntityConstructor = new (...args: any[]) => BaseEntityClass<any>;

type PluginType = {
  name: string,
  key: string,
  type: 'base' | 'house' | 'curtain' | 'other',
  entity: EntityConstructor,
  objType: 'point' | 'polyline',
  defaultValues: () => any[]
}

export default PluginType