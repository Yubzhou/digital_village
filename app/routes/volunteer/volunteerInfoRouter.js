// 用户信息页面路由

import express from "express";

// 导入自定义模块
import getInfo from "./user/getInfo.js";

const router = express.Router();

// 获取用户姓名、服务时长
router.get("/user/info/service", async (req, res) => {
  const fields = ["real_name", "service_minutes"]; // 需要返回的字段
  await getInfo(req, res, fields);
});

export default router;
