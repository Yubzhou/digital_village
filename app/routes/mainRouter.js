// 数字乡村模块系统路由配置
import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";

// 导入中间件
// 导入express-jwt配置中间件，用于验证token
import jwtAuth from "../middlewares/jwtAuthMiddleware.js";

// 导入路由
import loginRouter from "./main/loginRouter.js";
import registerRouter from "./main/registerRouter.js";
import { router as logoutRouter } from "./main/logoutRouter.js";
import newsRouter from "./main/newsRouter.js";
import feedbackRouter from "./main/feedbackRouter.js";
import eParticipationRouter from "./main/eParticipationRouter.js";
import { router as voteRouter, saveCacheOnExit } from "./main/voteRouter.js";
import userSettingsRouter from "./main/userSettingsRouter.js";
import grainPriceRouter from "./main/grainPriceRouter.js";
import { router as OllamaRouter, unloadModels } from "./main/ollamaRouter.js"; // ollama 路由

const router = express();

// // 配置 cors 中间件
// const corsOptions = {
//   // 如果希望请求包含 cookies 或其他认证信息，这要求服务器响应中 Access-Control-Allow-Origin 必须指定一个确切的源，而不是 *。
//   origin: ["https://127.0.0.1:5500", "https://localhost:5500", "https://localhost:5173", "https://127.0.0.1:5173"], // 允许的域名，可以用数组指定多个
//   // credentials: true, // 设置为 true，允许发送 cookie
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // 允许的HTTPS请求类型
//   allowedHeaders: ["Content-Type", "Authorization"], // 允许的请求头
// };
// // 允许跨域请求
// router.use(cors(corsOptions));

// 解析cookie
// router.use(cookieParser());

// 验证token
router.use("/main", jwtAuth);

router.get("/main", (req, res) => {
  res.send("<h1>数字乡村模块系统</h1>");
});

router.get("/main/test", (req, res) => {
  res.send("<h1>数字乡村模块系统测试页面</h1>");
});

// 使用路由中间件，注册路由
router.use("/main", registerRouter);

// 使用路由中间件，登录路由
router.use("/main", loginRouter);

// 使用路由中间件，登出路由
router.use("/main", logoutRouter);

// 使用路由中间件，新闻路由
router.use("/main", newsRouter);

// 使用路由中间件，留言反馈路由
router.use("/main", feedbackRouter);

// 使用路由中间件，问政路由
router.use("/main", eParticipationRouter);

// 使用路由中间件，投票路由
router.use("/main", voteRouter);

// 使用路由中间件，用户个人中心路由
router.use("/main", userSettingsRouter);

// 使用路由中间件，粮食收购价路由
router.use("/main", grainPriceRouter);

// 使用路由中间件，ollama路由
router.use("/main", OllamaRouter);

// 导出路由
export { router, saveCacheOnExit, unloadModels };
