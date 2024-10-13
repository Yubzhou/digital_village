// 通用路由配置
import express from "express";

import captchaRouter from "./general/captchaRouter.js";

const router = express.Router();

// 使用路由中间件，图片验证码路由
router.use("/", captchaRouter);

// 导出路由
export default router;
