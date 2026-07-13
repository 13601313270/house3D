import { EntityConstructor } from '@/types/baseEntity'
import PluginType from './pluginType'

export const allFileKeys: string[] = [
]
type TypeGroup = Array<{
  id: string,
  name: string,
  child: string[]
}>;
export const allFileKeysGroup: TypeGroup = [
  {
    id: 'base',
    name: '基础对象',
    child: []
  },
  {
    id: 'curtain',
    name: '幕布/图片',
    child: [],
  },
  {
    id: 'house',
    name: '户型/墙体',
    child: []
  },
  {
    id: 'camera',
    name: '相机',
    child: []
  },
  {
    id: 'other',
    name: '其他类型',
    child: [],
  }
]

export const allFileWithGroupId: { [key in string]: PluginType[] } = {

}

export const allFileKeysName: Record<string, string> = {
}

export const fileDataKeyToClass: Record<string, EntityConstructor> = {
};

export const allFileKeysObjType: Record<string, 'point' | 'polyline'> = {
};

export const allPluginByKey: Record<string, PluginType> = {
};
