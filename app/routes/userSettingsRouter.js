import express from "express";

// 导入自定义路由
import uploadProfileRouter from "./userSettings/uploadProfileRouter.js";
import userInfoRouter from "./userSettings/userInfoRouter.js";
import notificationRouter from "./userSettings/notificationRouter.js";
import updateUserAccountRouter from "./userSettings/updateUserAccountRouter.js";
import updateUserPasswordRouter from "./userSettings/updateUserPasswordRouter.js";

const router = express.Router();

// 使用上传头像路由
router.use("/", uploadProfileRouter);
// 使用获取用户信息路由
router.use("/", userInfoRouter);
// 使用更新用户账户路由（用户名、手机号、邮箱）
router.use("/", updateUserAccountRouter);
// 使用更新用户密码路由
router.use("/", updateUserPasswordRouter);

// 使用通知路由
router.use("/", notificationRouter);


export default router;
