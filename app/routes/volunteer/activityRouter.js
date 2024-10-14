import express from "express";

const router = express.Router();

// 导入自定义模块
import publishActivity from "./activity/publish.js";
import editActivity from "./activity/edit.js";
import getActivityList from "./activity/getList.js";
import getActivityDetail from "./activity/getDetail.js";

// 发布志愿者活动
router.post("/activity/publish", publishActivity);

// 编辑志愿者活动
router.put("/activity/edit/:id(\\d+)", editActivity);

// 志愿者活动列表
router.get("/activity/list", getActivityList);

// 志愿者活动详情
router.get("/activity/detail/:id(\\d+)", getActivityDetail);

export default router;
