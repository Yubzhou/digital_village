import express from "express";
import bcrypt from "bcryptjs";
import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";
import { checkPassword } from "../../../utils/checkData.js";

const router = express.Router();

// 用于存储已验证旧密码的用户状态的缓存对象，如果5分钟内用户没有修改密码，则会被清除
const verifiedUsers = {};
let isChanged = false; // 用于标记缓存是否发生变化
/*
verifiedUsers 缓存对象基本结构
verifiedUsers = {
  "userID": { timeStamp, oldPassword },
  "user1": { 1622222222222, "123456" },
  "user2": { 1622222225555, "654321" },
  "user3": { 1622222228888, "abc123" },
  ...
}
*/

// 根据用户ID获取用户信息
async function getUserByID(userID) {
  try {
    const sql = "SELECT * FROM `users` WHERE `user_id`=?";
    const result = await executeSql(sql, [userID]);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    throw error;
  }
}

// 校验旧密码
router.post("/user/password/check", async (req, res) => {
  // 获取用户ID
  const { sub: userID } = req.auth;
  // 获取用户输入的旧密码
  const { oldPassword } = req.body;
  try {
    // 查询用户消息
    const user = await getUserByID(userID);
    if (!user) {
      return res.status(401).json(jsondata("1001", "用户不存在", ""));
    }
    // 验证用户输入的旧密码是否正确，使用 bcrypt.compareSync() 方法，同步方法
    const isMatch = bcrypt.compareSync(oldPassword, user.hashed_password);
    if (!isMatch) {
      return res.status(401).json(jsondata("1002", "旧密码错误", ""));
    }
  } catch (error) {
    // console.error(error);
    return res.json(jsondata("1003", `校验旧密码出错: ${error.message}`, error));
  }

  // 存储用户的验证状态和当前时间戳
  verifiedUsers[userID] = { timeStamp: Date.now(), oldPassword }; // 存储当前时间戳 和 旧密码
  // console.log('verifiedUsers: ', verifiedUsers);
  isChanged = true; // 标记缓存发生变化

  // 返回结果
  return res.json(jsondata("0000", "旧密码正确", ""));
});

// 中间件：检查用户是否已验证旧密码
function checkOldPasswordVerified(req, res, next) {
  const { sub: userID } = req.auth;
  const verifiedUser = verifiedUsers[userID];

  // 检查用户是否已验证，以及是否在5分钟内
  if (!verifiedUser || Date.now() - verifiedUser.timeStamp > 5 * 60 * 1000) {
    // 5分钟的时间间隔
    delete verifiedUsers[userID]; // 超过5分钟则删除记录
    return res.status(403).json(jsondata("1004", "请先验证旧密码", ""));
  }
  next();
}

// 检查新密码是否与原密码相同，如果相同则返回错误信息
function checkNewPasswordSame(req, res, next) {
  const { sub: userID } = req.auth;
  const { newPassword } = req.body;
  const verifiedUser = verifiedUsers[userID];
  if (verifiedUser && verifiedUser.oldPassword === newPassword) {
    return res.status(403).json(jsondata("1005", "新密码不能与原密码相同", ""));
  }
  next();
}

// 更新用户密码
async function updateUserPassword(userID, newPassword) {
  try {
    // 哈希密码，同步方法
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const sql = "UPDATE `users` SET `hashed_password`=? WHERE `user_id`=?";
    const result = await executeSql(sql, [hashedPassword, userID]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

// 修改用户密码
router.patch("/user/password/update", checkOldPasswordVerified, checkNewPasswordSame, async (req, res) => {
  // 获取用户ID
  const { sub: userID } = req.auth;
  // 获取用户输入的新密码
  const { newPassword } = req.body;
  // 验证用户输入的新密码是否符合要求
  const isValid = checkPassword(newPassword);
  if (!isValid) {
    return res.json(jsondata("1006", "输入的新密码格式错误", "密码必须为ASCII可见字符（除空格），长度6-15位"));
  }
  try {
    // 更新用户密码
    const isSuccess = await updateUserPassword(userID, newPassword);
    if (!isSuccess) return res.json(jsondata("1007", "密码修改失败", "该用户不存在"));
  } catch (error) {
    // console.error(error);
    return res.json(jsondata("1008", `密码修改出错: ${error.message}`, error));
  }

  // 密码修改成功后，移除用户的已验证状态
  delete verifiedUsers[userID];

  // 返回结果
  return res.json(jsondata("0000", "密码修改成功", ""));
});

// 每隔1小时检查一次缓存，清除过期的验证记录
setInterval(() => {
  const now = Date.now();
  if (!isChanged) return; // 缓存未发生变化，不用检查
  for (const userID in verifiedUsers) {
    if (!verifiedUsers.hasOwnProperty(userID)) continue;
    const verifiedUser = verifiedUsers[userID];
    if (now - verifiedUser.timeStamp > 5 * 60 * 1000) {
      delete verifiedUsers[userID]; // 超过5分钟则删除记录
    }
  }
  // 清除缓存后，标记缓存为未发生变化
  isChanged = false;
}, 60 * 60 * 1000);

export default router;
