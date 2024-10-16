// 管理员管理审核报名活动路由

import express from "express";

// 导入中间件
import adminAuthMiddleware from "../../middlewares/adminAuthMiddleware.js";
import autoEndActivityMiddleware from "./autoEndActivityMiddleware.js";

// 导入自定义模块
import { getActivityList, getRegistrationList } from "./manage/getActivityList.js";
import reviewSignUp from "./manage/reviewSignUp.js";

const router = express.Router();

// 获取活动审核列表，需要管理员权限
router.get("/review/activity", adminAuthMiddleware, autoEndActivityMiddleware, getActivityList);

// 查看指定活动的报名列表，需要管理员权限
router.get("/review/registration/:activityId(\\d+)", adminAuthMiddleware, autoEndActivityMiddleware, getRegistrationList);

// 审核报名，需要管理员权限
router.post("/review/signup/:id(\\d+)", adminAuthMiddleware, reviewSignUp);

export default router;
