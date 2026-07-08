import { PointObjData } from "./map2d";
import { PointEntityClass } from "./pointEntity";

type CameraBaseData = PointObjData & {
  // 暂时为空，后面可以添加一些所有相机都有的属性
}

// 相机基础类，虽然这个类是空的，无逻辑的。但是通过所有相机都继承自这个类，业务代码里可以通过 instanceof CameraBase，来判断是否是相机实体
export abstract class CameraBase<T extends CameraBaseData> extends PointEntityClass<T> {
}