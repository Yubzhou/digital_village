// 管理员管理审核报名活动路由

import express from "express";

import adminAuthMiddleware from "../../middlewares/adminAuthMiddleware.js";

// 导入自定义模块
import { getActivityList, getRegistrationList } from "./manage/getActivityList.js";

const router = express.Router();

// 获取活动审核列表，需要管理员权限
router.get("/review/activity", adminAuthMiddleware, getActivityList);

// 查看指定活动的报名列表，需要管理员权限
router.get("/review/registration/:activityId(\\d+)", adminAuthMiddleware, getRegistrationList);

export default router;
