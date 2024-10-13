import express from "express";
import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";
import { checkAccount } from "../../../utils/checkData.js";

const router = express.Router();

// 账户映射表
const accountMapping = Object.freeze({
  username: "用户名",
  phone: "手机号",
  email: "邮箱",
  phone_number: "手机号",
});

// 验证账户是否合法中间件（用户名、手机号、邮箱）
function checkAccountValidMiddleware(req, res, next) {
  const { myAccountType: accountType, myAccount: account } = req;
  const checkResult = checkAccount(account);
  if (!checkResult || checkResult !== accountType) {
    return res.json(jsondata("1001", `${accountMapping[accountType]}格式错误`, ""));
  }
  next();
}

// 检查新账号是否与原账号相同，如果相同则返回错误信息
async function checkAccountSameMiddleware(req, res, next) {
  const { sub: userID } = req.auth;
  let { myAccountType: type, myAccount: value } = req;
  if (type === "phone") type = "phone_number";
  const sql = `SELECT ${type} FROM users WHERE user_id =?`;
  const result = await executeSql(sql, [userID]);
  if (result.length > 0) {
    const originalAccount = result[0][type];
    if (originalAccount === value) {
      return res.json(jsondata("1002", `新${accountMapping[type]}不能与原${accountMapping[type]}相同`, ""));
    }
  }
  next();
}

// 修改账户中间件（用户名、手机号、邮箱）
async function updateAccountMiddleware(req, res) {
  const { sub: userID } = req.auth;
  let { myAccountType: type, myAccount: value } = req;
  if (type === "phone") type = "phone_number";

  try {
    // 执行sql语句
    const sql = `UPDATE users SET ${type} =? WHERE user_id =?`;
    const result = await executeSql(sql, [value, userID]);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1003", "修改失败", "该用户不存在"));
    }
    console.log(result);
    return res.json(jsondata("0000", "修改成功", ""));
  } catch (error) {
    // console.log(error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.json(jsondata("1004", `修改失败：${error.message}`, `${accountMapping[type]}: ${value} 已被注册`));
    }
    return res.json(jsondata("1005", `修改出错：${error.message}`, error));
  }
}

// 修改用户名
router.patch(
  "/user/username",
  (req, res, next) => {
    req.myAccountType = "username";
    req.myAccount = req.body.username;
    next();
  },
  checkAccountValidMiddleware,
  checkAccountSameMiddleware,
  updateAccountMiddleware
);

// 修改手机号
router.patch(
  "/user/phone",
  (req, res, next) => {
    req.myAccountType = "phone";
    req.myAccount = req.body.phone;
    next();
  },
  checkAccountValidMiddleware,
  checkAccountSameMiddleware,
  updateAccountMiddleware
);

// 修改邮箱
router.patch(
  "/user/email",
  (req, res, next) => {
    req.myAccountType = "email";
    req.myAccount = req.body.email;
    next();
  },
  checkAccountValidMiddleware,
  checkAccountSameMiddleware,
  updateAccountMiddleware
);

export default router;
