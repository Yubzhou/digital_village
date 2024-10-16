// 端口号
const PORT = 443; // 443端口是HTTPS协议的默认端口

// 响应状态码
const STATUS_CODE = Object.freeze({
  SUCCESS: 200, // 表示成功
  UNAUTHORIZED: 401, // 表示客户端没有提供正确的认证信息
  FORBIDDEN: 403, // 表示客户端没有权限访问
  NOT_FOUND: 404, // 表示请求的资源不存在
  INTERNAL_SERVER_ERROR: 500, // 表示服务器内部错误
});

// 通知类型
const NOTIFICATION_TYPE = Object.freeze({
  E_PARTICIPATION: 1, // 网络问政
  VOLUNTEER_REVIEW: 2, // 志愿活动报名审核结果
});

export { PORT, STATUS_CODE, NOTIFICATION_TYPE };
