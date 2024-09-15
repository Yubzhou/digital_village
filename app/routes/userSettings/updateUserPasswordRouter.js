import express from "express";
import bcrypt from "bcryptjs";
import { executeSql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";
import { checkPassword } from "../../utils/checkData.js";

const router = express.Router();

// 用于存储已验证旧密码的用户状态的缓存对象
const verifiedUsers = {};

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
      return res.status(401).json(jsondata("1002", "密码错误", ""));
    }
  } catch (error) {
    // console.error(error);
    return res.json(jsondata("1003", `校验旧密码出错: ${error.message}`, error));
  }

  // 缓存已验证的用户状态
  verifiedUsers[userID] = true;
  // console.log('verifiedUsers: ', verifiedUsers);

  // 返回结果
  return res.json(jsondata("0000", "旧密码正确", ""));
});

// 中间件：检查用户是否已验证旧密码
function checkOldPasswordVerified(req, res, next) {
  const { sub: userID } = req.auth;
  if (!verifiedUsers[userID]) {
    return res.status(403).json(jsondata("1004", "请先验证旧密码", ""));
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
router.patch("/user/password/update", checkOldPasswordVerified, async (req, res) => {
  // 获取用户ID
  const { sub: userID } = req.auth;
  // 获取用户输入的新密码
  const { newPassword } = req.body;
  // 验证用户输入的新密码是否符合要求
  const isValid = checkPassword(newPassword);
  if (!isValid) {
    return res.json(jsondata("1005", "输入的新密码格式错误", "密码必须为ASCII可见字符（除空格），长度6-15位"));
  }
  try {
    // 更新用户密码
    const isSuccess = await updateUserPassword(userID, newPassword);
    if (!isSuccess) return res.json(jsondata("1006", "密码修改失败", ""));
  } catch (error) {
    // console.error(error);
    return res.json(jsondata("1007", `密码修改出错: ${error.message}`, error));
  }

  // 密码修改成功后，移除用户的已验证状态
  delete verifiedUsers[userID];

  // 返回结果
  return res.json(jsondata("0000", "密码修改成功", ""));
});

export default router;
