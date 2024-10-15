import express from "express";

const router = express.Router();

import adminAuthMiddleware from "../../middlewares/adminAuthMiddleware.js";

// 导入自定义模块
import publishActivity from "./activity/publish.js";
import uploadCover from "./uploads/activityCoverRouter.js";
import editActivity from "./activity/edit.js";
import endActivity from "./activity/end.js";
import signupActivity from "./activity/signup.js";

// 发布志愿活动，需要管理员权限
router.post("/activity/publish", adminAuthMiddleware, publishActivity);

// 使用志愿活动封面上传路由，需要管理员权限
router.use(uploadCover);

// 编辑志愿活动，需要管理员权限
router.patch("/activity/edit/:id(\\d+)", adminAuthMiddleware, editActivity);

// 结束志愿活动（只能结束未开始的活动），需要管理员权限
router.post("/activity/end/:id(\\d+)", adminAuthMiddleware, endActivity);

// 志愿者报名活动
router.post("/activity/signup/:id(\\d+)", signupActivity);

// 管理审核报名

export default router;
