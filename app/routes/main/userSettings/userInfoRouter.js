import express from "express";
import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

const router = express.Router();

// 获取用户发布的问政文章总数
async function getArticleCount(userID) {
  try {
    // 查询用户发布的问政文章总数
    const sql = "SELECT COUNT(*) AS `count` FROM `e_participation` WHERE `user_id`=?";
    const result = await executeSql(sql, [userID]);
    return result.length === 0 ? 0 : result[0]["count"];
  } catch (error) {
    throw error;
  }
}

// 获取用户的总投票数
async function getVoteCount(userID) {
  try {
    // 查询用户的总投票数
    const sql = "SELECT COUNT(*) AS `count` FROM `user_vote_records` WHERE `user_id`=?";
    const result = await executeSql(sql, [userID]);
    return result.length === 0 ? 0 : result[0]["count"];
  } catch (error) {
    throw error;
  }
}

// 根据用户ID查询用户信息
async function getUserByID(userID) {
  try {
    // 查询用户信息
    const sql = "SELECT * FROM `users` WHERE `user_id`=? LIMIT 1";
    const result = await executeSql(sql, [userID]);
    if (result.length === 0) return null;
    const user = result[0];
    delete user["hashed_password"]; // 删除密码信息
    // 隐私手机号信息
    user["phone_number"] && (user["phone_number"] = user["phone_number"].slice(0, 3) + "*****" + user["phone_number"].slice(8));
    // 隐私邮箱信息，根据邮箱用户名长度动态隐藏
    const email = user["email"];
    if (email) {
      // 获取邮箱用户名和邮箱域名
      const [emailName, emailDomain] = email.split("@");
      // 显示邮箱用户名长度的前30%
      const emailNameLength = Math.round(emailName.length * 0.3);
      user["email"] = emailName.slice(0, emailNameLength) + "*".repeat(emailName.length - emailNameLength + 1) + emailDomain;
    }
    // 获取用户发布的问政文章总数
    const articleCount = await getArticleCount(userID);
    // 获取用户的总投票数
    const voteCount = await getVoteCount(userID);
    // 合并用户信息
    user["article_count"] = articleCount;
    user["vote_count"] = voteCount;
    return user;
  } catch (error) {
    throw error;
  }
}

router.get("/user", async (req, res) => {
  // 获取当前用户ID
  const { sub: userID } = req.auth;
  if (!userID) return res.json(jsondata("1001", "无权限，禁止访问，请先登录", ""));
  try {
    // 查询用户信息
    const user = await getUserByID(userID);
    if (!user) return res.json(jsondata("1002", "用户不存在", ""));
    // 返回用户信息
    return res.json(jsondata("0000", "查询成功", user));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1003", `查询失败: ${error.message}`, error));
  }
});

export default router;
