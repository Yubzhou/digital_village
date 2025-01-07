// 协议定义
const PROTOCOL = Object.freeze({
  HTTP: "http",
  HTTPS: "https",
});

// 默认服务器配置
const DEFAULT_SERVER_CONFIG = {
  HOST: "localhost",
  PORTS: {
    HTTP: 80,
    HTTPS: 443,
  },
  PROTOCOL: PROTOCOL.HTTP, // 默认协议
};

// 动态构建URL的辅助函数
function buildUrl({ protocol, host, port }) {
  return `${protocol}://${host}:${port}`;
}

// 服务器配置
const SERVER_CONFIG = Object.freeze({
  PORT: DEFAULT_SERVER_CONFIG.PORTS[DEFAULT_SERVER_CONFIG.PROTOCOL.toUpperCase()],
  URL: buildUrl({
    protocol: DEFAULT_SERVER_CONFIG.PROTOCOL,
    host: DEFAULT_SERVER_CONFIG.HOST,
    port: DEFAULT_SERVER_CONFIG.PORTS[DEFAULT_SERVER_CONFIG.PROTOCOL.toUpperCase()],
  }),
  PROTOCOL: DEFAULT_SERVER_CONFIG.PROTOCOL,
});


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

export { SERVER_CONFIG, STATUS_CODE, NOTIFICATION_TYPE };
