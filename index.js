import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
// import http from "http";
// import https from "https";

// 导入全局配置文件
import { SERVER_CONFIG } from "./app/config/config.js";

// 执行创建目录函数
import "./app/utils/createDirectory.js";

// // 导入mkcert配置，导入https证书
// import mkcertOptions from "./app/config/mkcertConfig.js";
// 导入数据库连接池
import pool from "./app/config/dbConfig.js";
// 导入自定义工具
import jsondata from "./app/utils/jsondata.js";

// 导入general路由
import generalRouter from "./app/routes/generalRouter.js";
// 导入main路由
import { router as mainRouter, saveCacheOnExit, unloadModels } from "./app/routes/mainRouter.js";
// 导入volunteer路由
import volunteerRouter from "./app/routes/volunteerRouter.js";

const app = express();

// 获取协议类型
const { PROTOCOL } = SERVER_CONFIG;

// 配置 cors 中间件，允许指定的域名跨域请求
const corsOptions = {
  // 如果希望请求包含 cookies 或其他认证信息，这要求服务器响应中 Access-Control-Allow-Origin 必须指定一个确切的源，而不是 *。
  origin: [`${PROTOCOL}://127.0.0.1:5500`, `${PROTOCOL}://localhost:5500`, `${PROTOCOL}://localhost:5173`, `${PROTOCOL}://127.0.0.1:5173`], // 允许的域名，可以用数组指定多个
  // credentials: true, // 设置为 true，允许发送 cookie
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // 允许的HTTPS请求类型
  allowedHeaders: ["Content-Type", "Authorization"], // 允许的请求头
};
// 允许跨域请求
app.use(cors(corsOptions));

// 解析请求体
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: false })); // 解析 URL 编码的请求体

// 自定义__filename和__dirname, 因为type：module（使用ES模块），所以不能使用__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静态资源目录
app.use("/public", express.static(path.resolve(__dirname, "./app/public")));

app.get("/", (req, res) => {
  res.send("<h1>欢迎使用数字乡村服务平台</h1>");
});

app.get("/api", (req, res) => {
  res.send("<h1>数字乡村服务平台后端API接口</h1>");
});

// 使用路由中间件
app.use("/api", generalRouter);
app.use("/api", mainRouter);
app.use("/api", volunteerRouter);

// 处理 404 错误
app.all("*", (req, res) => {
  res.status(404).send("<h1>404 Not Found</h1>");
});

// 处理报错
app.use((err, req, res, next) => {
  // console.log(err);
  if (err.name === "UnauthorizedError") {
    res.status(401).json(jsondata(err.status, err.inner.message, err));
    console.log(err.inner.message);
  } else {
    res.status(500).json(jsondata("5000", `服务器内部错误: ${err.message}`, err));
  }
});

async function startServer(serverConfig) {
  const { PORT, URL, PROTOCOL } = serverConfig;

  try {
    let server;
    if (PROTOCOL === "https") {
      // 动态导入mkcert配置，导入https证书
      const mkcertOptions = await import("./app/config/mkcertConfig.js");
      // 动态导入https模块
      const https = await import('https');
      // 创建HTTPS服务器（mkcertOptions.default表示访问模块的默认导出）
      server = https.createServer(mkcertOptions.default, app);
    } else if (PROTOCOL === "http") {
      // 动态导入http模块
      const http = await import('http');
      // 创建HTTP服务器
      server = http.createServer(app);
    } else {
      throw new Error(`Invalid server protocol: ${PROTOCOL}. Check "app/config/config.js" for valid configuration.`);
    }

    // 监听端口
    server.listen(PORT, () => {
      console.log(`${PROTOCOL.toUpperCase()} server running on port ${PORT}, ${URL}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

// 调用 startServer 并传入 SERVER_CONFIG 配置
startServer(SERVER_CONFIG).catch(err => console.error("Error starting server:", err));

// 处理服务器关闭事件
async function exitHandler() {
  try {
    // 保存投票缓存到数据库
    await saveCacheOnExit();
    // 关闭数据库连接池
    await pool.end();
    console.log("Database connection pool closed.");
    // 卸载 ollama 模型
    await unloadModels();
  } catch (err) {
    console.log(err);
  }
  console.log("Server is shutting down...");

  // 等待一段时间以确保所有清理工作都已经完成
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 退出 Node.js 服务
  process.exit(0); // 0 表示正常退出
}

// 当服务器关闭时，执行一些清理操作
process.on("SIGTERM", exitHandler);
process.on("SIGINT", exitHandler);
