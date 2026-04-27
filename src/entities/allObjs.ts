type ObjItem = {
  id: string
  url: string
  scaleX: number
  scaleY: number
  scaleZ: number
}
const objFiles: ObjItem[] = [
  {
    id: 'bed',
    url: 'https://video-obj.oss-cn-beijing.aliyuncs.com/bed.obj',
    scaleX: 2.7,
    scaleY: 2.7,
    scaleZ: 2.2,
  },
  {
    id: 'table',
    url: 'https://video-obj.oss-cn-beijing.aliyuncs.com/table.obj',
    scaleX: 0.1,
    scaleY: 0.1,
    scaleZ: 0.1,
  }
]
export default objFiles
export type { ObjItem }