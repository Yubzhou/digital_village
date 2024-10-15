// 志愿者模块系统路由配置
import express from "express";

// 导入中间件
// 导入express-jwt配置中间件，用于验证token
import jwtAuth from "../middlewares/jwtAuthMiddleware.js";
// 导入志愿者身份认证中间件
import volunteerAuthMiddleware from "../middlewares/volunteerAuthMiddleware.js";

// 导入志愿者模块相关路由
import visitorRouter from "./volunteer/visitorRouter.js";
import registerRouter from "./volunteer/registerRouter.js";
import activityRouter from "./volunteer/activityRouter.js";
import manageActivityRouter from "./volunteer/manageActivityRouter.js";
import volunteerInfoRouter from "./volunteer/volunteerInfoRouter.js";

const router = express.Router();

// 验证token
router.use("/volunteer", jwtAuth);

// 志愿者身份认证
// router.use("/volunteer", volunteerAuthMiddleware);

router.get("/volunteer", (req, res) => {
  res.send("<h1>志愿者模块系统</h1>");
});

router.get("/volunteer/test", (req, res) => {
  res.send("<h1>志愿者模块系统测试页面</h1>");
});

// 游客路由
router.use("/volunteer", visitorRouter);
// 注册成为志愿者相关路由
router.use("/volunteer", registerRouter);
// 志愿者活动相关路由, 需验证志愿者身份
router.use("/volunteer", volunteerAuthMiddleware, activityRouter);
// 管理志愿者活动相关路由, 需验证志愿者身份
router.use("/volunteer", volunteerAuthMiddleware, manageActivityRouter);
// 志愿者信息相关路由, 需验证志愿者身份
router.use("/volunteer", volunteerAuthMiddleware, volunteerInfoRouter);

export default router;
