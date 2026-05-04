import { EntityClass } from "@/types/entity";

type EntityConstructor = new (...args: any[]) => EntityClass<any>;

type PluginType = {
  name: string,
  key: string,
  entity: EntityConstructor,
}

export default PluginType