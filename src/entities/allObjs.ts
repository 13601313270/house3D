type ObjItem = {
  id: string
  url: string
  scale: number
}
const objFiles: ObjItem[] = [
  {
    id: 'bed',
    url: 'https://video-obj.oss-cn-beijing.aliyuncs.com/bed.obj',
    scale: 5,
  },
]
export default objFiles
export type { ObjItem }