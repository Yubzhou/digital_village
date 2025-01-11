// 管理员权限认证中间件
import jsondata from "../utils/jsondata.js";

function adminAuthMiddleware(req, res, next) {
  const auth = req.auth;
  if (!auth) {
    return res.status(401).json(jsondata("1001", "未登录", ""));
  }
  if (!auth.isAdmin) {
    return res.status(403).json(jsondata("1002", "无权限：需要管理员权限", ""));
  }
  next();
}

export default adminAuthMiddleware;
