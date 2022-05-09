import axios from 'axios'

axios.defaults.baseURL = 'http://127.0.0.1:8000';
axios.defaults.withCredentials = true; // 使axios带上cookie
axios.defaults.headers.post['Content-Type'] = 'application/json; charset=UTF-8' //'application/x-www-form-urlencoded';


// http request拦截器 添加一个请求拦截器
// axios.interceptors.request.use(function (config) {

//     return config;
// }, function (error) {
//     return Promise.reject(error);
// });



// axios.interceptors.response.use(
//     res => {
        
//         return res;
//     }
// );


export default axios;