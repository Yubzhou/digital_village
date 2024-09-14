import express from "express";
import { executeSql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";

const router = express.Router();

// 获取用户自己全部的通知
router.get("/notification", async (req, res) => {
  // 获取用户ID
  const { sub: userID } = req.auth;
  try {
    // 查询数据库获取用户的通知, 按最新通知排序
    const sql = "SELECT * FROM `notifications` WHERE `user_id`=? ORDER BY `id` DESC";
    const notifications = await executeSql(sql, [userID]);
    res.json(jsondata("0000", "获取成功", notifications));
  } catch (error) {
    // console.log(error);
    res.json(jsondata("1001", `获取失败: ${error.message}`, error));
  }
});

export default router;
