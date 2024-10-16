// 游客权限路由，即游客能访问的一些接口

import express from "express";

// 导入自定义模块
import getActivityList from "./activity/getList.js";
import getActivityDetail from "./activity/getDetail.js";

// 导入中间件
import autoEndActivityMiddleware from "./autoEndActivityMiddleware.js";

const router = express.Router();

// 获取志愿活动列表
router.get("/activity/list", autoEndActivityMiddleware, getActivityList);

// 获取志愿活动详情
router.get("/activity/detail/:id(\\d+)", autoEndActivityMiddleware, getActivityDetail);

// 导出路由
export default router;
