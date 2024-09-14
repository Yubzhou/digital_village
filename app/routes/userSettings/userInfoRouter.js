import express from "express";
import { executeSql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";

const router = express.Router();

// 根据用户ID查询用户信息
async function getUserByID(userID) {
  if (!userID) return null;
  try {
    // 查询用户信息
    const sql = "SELECT * FROM `users` WHERE `user_id`=? LIMIT 1";
    const result = await executeSql(sql, [userID]);
    if (result.length === 0) return null;
    delete result[0]["hashed_password"]; // 删除密码信息
    return result[0];
  } catch (error) {
    throw error;
  }
}

router.get("/user", async (req, res) => {
  // 获取当前用户ID
  const { sub: userID } = req.auth;
  try {
    // 查询用户信息
    const user = await getUserByID(userID);
    if (!user) return res.json(jsondata("1001", "用户不存在", ""));
    // 返回用户信息
    return res.json(jsondata("0000", "查询成功", user));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1002", `查询失败: ${error.message}`, error));
  }
});

export default router;
