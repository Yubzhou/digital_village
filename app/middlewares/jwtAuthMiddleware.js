import { expressjwt } from "express-jwt"; // 引入express-jwt模块
import jwtConfig from "../config/jwtConfig.js"; // 引入自定义的jwt配置文件

// 验证token是否过期
const jwtAuth = expressjwt({
  // 设置密钥
  secret: jwtConfig.ACCESS_SECRET_KEY,
  // 设置为true表示校验，false表示不校验
  credentialsRequired: true,
  // 加入算法
  algorithms: ["HS256"],
  // 设置请求对象中负载的属性名称
  requestProperty: "auth",
  // 设置jwt认证白名单，比如/login登录接口不需要拦截
}).unless({
  // path: ["/main/register", { url: "/main/login/:username", methods: ["get"] }],
  // 如果不使用正则表达式，则需要使用绝对路径，即/api/main/news
  // 使用正则表达式，则可以使用相对路径，即/main/news
  path: [
    /^\/api\/main\/?$/,
    /\/main\/news/,
    /\/main\/grain/,
    /\/main\/register/,
    /\/main\/login/,
    /\/main\/refresh/,
    /^\/api\/volunteer\/?$/,
    /\/volunteer\/register/,
    /\/volunteer\/activity\/list/,
    /\/volunteer\/activity\/detail/,
  ],
});

export default jwtAuth;
