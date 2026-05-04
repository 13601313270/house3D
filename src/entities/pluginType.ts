import { EntityClass } from "@/types/entity";
import { EntityType } from ".";

type EntityConstructor = new (...args: any[]) => EntityClass<any>;

type PluginType = {
  name: string,
  key: EntityType,
  entity: EntityConstructor,
}

export default PluginType