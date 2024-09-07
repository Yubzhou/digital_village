import jsondata from "../utils/jsondata.js";

function adminAuthMiddleware(req, res, next) {
  const auth = req.auth;
  console.log(auth);
  
  
  if (!auth || !auth.isAdmin) {
    return res.status(401).json(jsondata('1001', '没有权限访问：需要管理员权限', ''));
  }
  next();
}

export default adminAuthMiddleware;
