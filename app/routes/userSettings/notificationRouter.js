import express from "express";
import jsondata from "../../utils/jsondata.js";
import { getNotificationList } from "../../utils/notificationTools.js";

const router = express.Router();

// 获取用户自己全部的通知
router.get("/notification", async (req, res) => {
  // 获取用户ID
  const { sub: userID } = req.auth;
  try {
    // 查询数据库获取用户的通知, 按最新通知排序
    const notifications = await getNotificationList(userID, req.query);
    res.json(jsondata("0000", "获取成功", notifications));
  } catch (error) {
    // console.log(error);
    res.json(jsondata("1001", `获取失败: ${error.message}`, error));
  }
});

export default router;
