import * as THREE from 'three'
import { PointWithTargetObjData } from './map2d'
import { PointEntityClass } from './pointEntity'

export abstract class PointWithTargetEntityClass<T extends PointWithTargetObjData> extends PointEntityClass<T> {
}
