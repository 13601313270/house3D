import { BaseEntityClass } from "@/types/baseEntity";
import { PointEntityClass } from "@/types/pointEntity";

type EntityConstructor = new (...args: any[]) => BaseEntityClass<any>;

type PluginType = {
  name: string,
  key: string,
  type: 'base' | 'house' | 'curtain' | 'other',
  entity: EntityConstructor,
}

export default PluginType