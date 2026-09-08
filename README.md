associationEntity

PointEntityClass
    EntityClassInWall拥有的能力
        1、可移动句柄限制到只有z轴可以移动
        2、待添加状态根据磁吸位置
            1、绑定自己的wallId、wallPointId
            2、和wall的associationEntity双向绑定，且设置dirty
        3、带有一个reBuildWall方法，重构自己绑定的墙
        4、inSceneSnapLineArea，当前对象进入到一根吸附线的区域，吸附线是墙，则和wall的associationEntity双向绑定，且设置dirty
        5、notInSceneSnapLineArea，当对象不在吸附线区域，则解除和wall的associationEntity双向绑定，且设置dirty


setPrepareState

camera和point之间，添加一个中间的抽象类，就是point有一个点，还有一个目标点的抽象类。

已经有一个中间类realyCamera了。






# house3d

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
