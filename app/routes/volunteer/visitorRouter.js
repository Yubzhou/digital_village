// 游客权限路由，即游客能访问的一些接口

import express from "express";

// 导入自定义模块
import getActivityList from "./activity/getList.js";
import getActivityDetail from "./activity/getDetail.js";

const router = express.Router();

// 获取志愿活动列表
router.get("/activity/list", getActivityList);

// 获取志愿活动详情
router.get("/activity/detail/:id(\\d+)", getActivityDetail);

// 导出路由
export default router;
