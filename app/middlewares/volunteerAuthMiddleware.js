// 志愿者权限认证中间件
import jsondata from "../utils/jsondata.js";

function volunteerAuthMiddleware(req, res, next) {
  const auth = req.auth;
  if (!auth) {
    return res.status(401).json(jsondata("1001", "未登录", ""));
  }
  if (!auth.isVolunteer) {
    return res.status(403).json(jsondata("1002", "无权限：需要志愿者身份", ""));
  }
  next();
}

export default volunteerAuthMiddleware;
