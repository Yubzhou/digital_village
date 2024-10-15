// 管理员管理审核报名活动路由

import express from "express";

import adminAuthMiddleware from "../../middlewares/adminAuthMiddleware.js";

// 导入自定义模块
import getSignUpList from "./manage/getList.js";

const router = express.Router();

// 获取报名信息列表，需要管理员权限
router.get("/signup/list", adminAuthMiddleware, getSignUpList);

export default router;
