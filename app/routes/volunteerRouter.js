// 志愿者模块系统路由配置
import express from "express";

// 导入中间件
// 导入express-jwt配置中间件，用于验证token
import jwtAuth from "../middlewares/volunteer/jwtAuthMiddleware.js";

// 导入志愿者模块相关路由
import registerRouter from "./volunteer/registerRouter.js";
import loginRouter from "./volunteer/loginRouter.js";
import logoutRouter from "./volunteer/logoutRouter.js";
import activityRouter from "./volunteer/activityRouter.js";
import volunteerInfoRouter from "./volunteer/volunteerInfoRouter.js";

const router = express.Router();

// 验证token
router.use("/volunteer", jwtAuth);

router.get("/volunteer", (req, res) => {
  res.send("<h1>志愿者模块系统</h1>");
});

router.get("/volunteer/test", (req, res) => {
  res.send("<h1>志愿者模块系统测试页面</h1>");
});

// 注册成为志愿者相关路由
router.use("/volunteer", registerRouter);
// 登录志愿者相关路由
router.use("/volunteer", loginRouter);
// 退出登录相关路由
router.use("/volunteer", logoutRouter);
// 志愿者活动相关路由
router.use("/volunteer", activityRouter);
// 志愿者信息相关路由
router.use("/volunteer", volunteerInfoRouter);

export default router;
