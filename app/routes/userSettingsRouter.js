import express from "express";

// 导入自定义路由
import uploadProfileRouter from "./userSettings/uploadProfileRouter.js";
import userInfoRouter from "./userSettings/userInfoRouter.js";
import notificationRouter from "./userSettings/notificationRouter.js";

const router = express.Router();

// 使用上传头像路由
router.use("/", uploadProfileRouter);
// 使用用户信息路由
router.use("/", userInfoRouter);

// 使用通知路由
router.use("/", notificationRouter);

export default router;
