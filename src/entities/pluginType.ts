import { BaseEntityClass } from "@/types/baseEntity";
import { BaseObjData } from "@/types/map2d";

type EntityConstructor = new (...args: any[]) => BaseEntityClass<any>;

export type DefaultItem<T extends BaseObjData = BaseObjData> = {
  name: string,
  img?: string,
  data: T
}

type PluginType = {
  name: string,
  key: string,
  type: 'base' | 'house' | 'curtain' | 'other' | number, // number的时候，代表归属在分类中，值就是ID
  entity: EntityConstructor,
  previewImg?: string,
  objType: 'point' | 'polyline',
  defaultValues: () => Promise<DefaultItem[]> | DefaultItem[]
}

export default PluginType