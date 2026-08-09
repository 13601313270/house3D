import axios, { AxiosInstance } from 'axios'
// 创建一个 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: location.host === 'localhost:8080' ? ('http://' + location.host + '/api') : 'https://api.studying1v1.com', // 所有的请求地址前缀部分
  timeout: 240000, // 请求超时时间毫秒
  // withCredentials: true, // 异步请求携带cookie
  headers: {
    // 设置后端需要的传参类型
    'Content-Type': 'application/json',
    'token': localStorage.getItem('token') || '',
    // 'X-Requested-With': 'XMLHttpRequest',
  },
})

// 添加请求拦截器
// @ts-ignore
service.interceptors.request.use(
  function (config: any) {
    config.baseURL = 'https://api.studying1v1.com'
    // alert(localStorage.getItem('token'))
    // 在发送请求之前做些什么
    config.headers.token = localStorage.getItem('token')
    return config
  },
  function (error: any) {
    // 对请求错误做些什么
    console.log(error)
    return Promise.reject(error)
  }
)
export default service