import { expressjwt } from "express-jwt"; // 引入express-jwt模块
import jwtConfig from "../../config/jwtConfig.js"; // 引入自定义的jwt配置文件

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
  // path: ["/volunteer/register", { url: "/volunteer/register/:phone", methods: ["get"] }],
  // 如果不使用正则表达式，则需要使用绝对路径，即/api/volunteer/register
  // 使用正则表达式，则可以使用相对路径，即/volunteer/register
  path: [/^\/api\/volunteer\/?$/, /\/volunteer\/register/, /\/volunteer\/login/, /\/volunteer\/refresh/],
});

export default jwtAuth;
