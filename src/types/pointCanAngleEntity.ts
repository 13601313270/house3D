import { PointCanAngleObjData } from "./map2d";
import { PointEntityClass } from "./pointEntity";

// 可以旋转的点对象
export abstract class PointCanAngleEntity<T extends PointCanAngleObjData> extends PointEntityClass<T> {

}