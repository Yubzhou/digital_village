import express from "express";
import cors from "cors";
// import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

// 导入mkcert配置，导入https证书
import mkcertOptions from "./app/config/mkcertConfig.js";
// 导入数据库连接池
import pool from "./app/config/dbConfig.js";

// 导入中间件
// 导入express-jwt配置中间件，用于验证token
import jwtAuth from "./app/middlewares/jwtAuthMiddleware.js";

// 导入路由
import userTestRouter from "./app/routes/userTestRouter.js";
import captchaRouter from "./app/routes/captchaRouter.js";
import loginRouter from "./app/routes/loginRouter.js";
import registerRouter from "./app/routes/registerRouter.js";
import logoutRouter from "./app/routes/logoutRouter.js";
import newsRouter from "./app/routes/newsRouter.js";
import feedbackRouter from "./app/routes/feedbackRouter.js";
import eParticipationRouter from "./app/routes/eParticipationRouter.js";
import { router as voteRouter, saveCacheOnExit } from "./app/routes/voteRouter.js";

// 导入自定义工具
import jsondata from "./app/utils/jsondata.js";

const app = express();

// 配置 cors 中间件
const corsOptions = {
  // 如果希望请求包含 cookies 或其他认证信息，这要求服务器响应中 Access-Control-Allow-Origin 必须指定一个确切的源，而不是 *。
  origin: ["https://127.0.0.1:5500", "https://localhost:5500", "https://localhost:5173", "https://127.0.0.1:5173"], // 允许的域名，可以用数组指定多个
  // credentials: true, // 设置为 true，允许发送 cookie
  methods: ["GET", "POST", "PUT", "DELETE", "DELETE", "OPTIONS"], // 允许的HTTPS请求类型
  allowedHeaders: ["Content-Type", "Authorization"], // 允许的请求头
};
// 允许跨域请求
app.use(cors(corsOptions));

// 验证token
app.use(jwtAuth);

// 解析cookie
// app.use(cookieParser());
// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 自定义__filename和__dirname, 因为type：module（使用ES模块），所以不能使用__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静态资源目录
app.use("/public", express.static(path.resolve(__dirname, "./app/public")));

app.get("/", (req, res) => {
  res.send("<h1>欢迎使用数字乡村服务平台</h1>");
});

// 使用路由中间件，用户路由
app.use("/api", userTestRouter);

// 使用路由中间件，图片验证码路由
app.use("/api", captchaRouter);

// 使用路由中间件，注册路由
app.use("/api", registerRouter);

// 使用路由中间件，登录路由
app.use("/api", loginRouter);

// 使用路由中间件，登出路由
app.use("/api", logoutRouter);

// 使用路由中间件，新闻路由
app.use("/api", newsRouter);

// 使用路由中间件，留言反馈路由
app.use("/api", feedbackRouter);

// 使用路由中间件，问政路由
app.use("/api", eParticipationRouter);

// 使用路由中间件，投票路由
app.use("/api", voteRouter);

// 处理 404 错误
app.all("*", (req, res) => {
  res.status(404).send("<h1>404 Not Found</h1>");
});

// 处理报错
app.use((err, req, res, next) => {
  // console.log(err);
  if (err.name === "UnauthorizedError") {
    res.status(401).json(jsondata(err.status, err.inner.message, err));
  } else {
    res.status(500).json(jsondata("5000", "服务器内部错误", err));
  }
});

// 创建HTTPS服务器
const server = https.createServer(mkcertOptions, app).listen(443, () => {
  console.log("HTTPS server running on port 443, https://localhost:443, https://127.0.0.1:443");
});

async function exitHandler() {
  try {
    // 保存投票缓存到数据库
    await saveCacheOnExit();
    // 关闭数据库连接池
    await pool.end();
  } catch (err) {
    console.log(err);
  }
  console.log("Server is shutting down...");

  // 等待一段时间以确保所有清理工作都已经完成
  await new Promise(resolve => setTimeout(resolve, 300));

  // 退出 Node.js 服务
  process.exit(0); // 0 表示正常退出
}

// 当服务器关闭时，执行一些清理操作
process.on("SIGTERM", exitHandler);
process.on("SIGINT", exitHandler);
