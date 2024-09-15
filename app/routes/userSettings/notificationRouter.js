import express from "express";
import jsondata from "../../utils/jsondata.js";
import { getNotificationList, updateUserHasNewNotification } from "../../utils/notificationTools.js";
import { executeSql } from "../../utils/dbTools.js";

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


// 标记用户的全部通知为已读，一键已读
router.patch("/notification/all", async (req, res) => {
  // 获取用户ID
  const { sub: userID } = req.auth;
  try {
    const sql = "UPDATE `notifications` SET `is_read`=TRUE WHERE user_id=? AND `is_read`=FALSE";
    const result = await executeSql(sql, [userID]);
    // 更新用户的新通知状态为false
    await updateUserHasNewNotification(userID, false);
    res.json(jsondata("0000", "标记成功", ''));
  } catch (error) {
    // console.log(error);
    res.json(jsondata("1001", `标记失败: ${error.message}`, error));
  }
});

// 标记用户的单个通知为已读
router.patch("/notification/single/:id(\\d+)", async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "UPDATE `notifications` SET `is_read`=TRUE WHERE `id`=?";
    const result = await executeSql(sql, [id]);
    res.json(jsondata("0000", "标记成功", ''));
  } catch (error) {
    // console.log(error);
    res.json(jsondata("1001", `标记失败: ${error.message}`, error));
  }
});

// 将users表的has_new_notification字段设置为false
router.patch("/notification/user", async (req, res) => {
  // 获取用户ID
  const { sub: userID } = req.auth;
  try {
    await updateUserHasNewNotification(userID, false);
    res.json(jsondata("0000", "标记成功", ''));
  } catch (error) {
    // console.log(error);
    res.json(jsondata("1001", `标记失败: ${error.message}`, error));
  }
});

export default router;
