import { BaseEntityClass } from "@/types/baseEntity";
import { BaseObjData } from "@/types/map2d";

type EntityConstructor = new (...args: any[]) => BaseEntityClass<any>;

export type DefaultItem<T extends BaseObjData = BaseObjData> = {
  data: T
}

type PluginType = {
  name: string,
  key: string,
  type: 'base' | 'house' | 'curtain' | 'other',
  entity: EntityConstructor,
  objType: 'point' | 'polyline',
  defaultValues: () => DefaultItem[]
}

export default PluginType