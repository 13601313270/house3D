import * as THREE from 'three'
import { PointObjData } from "./map2d";
import { PointEntityClass } from "./pointEntity";

export type CameraBaseData = PointObjData & {
  // 这里以后可以存放相机通用的属性
}

// 相机基础类，虽然这个类是空的，无逻辑的。但是通过所有相机都继承自这个类，业务代码里可以通过 instanceof CameraBase，来判断是否是相机实体
export abstract class CameraBase<T extends CameraBaseData> extends PointEntityClass<T> {
  // 对应真实场景中的相机对象
  realyCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null
}