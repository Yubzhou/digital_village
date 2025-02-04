import express from "express";
import bcrypt from "bcryptjs";
import { executeSql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";
import { checkEmpty, checkUsername, checkPassword, checkCaptcha, checkPhone } from "../../utils/checkData.js";

const router = express.Router();

// 检查数据是否正确
async function checkData(req, res, next) {
  // 获取前端提交的表单数据
  const { username, password, phone, captchaId, captchaCode } = req.body;

  // 校验表单数据
  const isNotEmpty = checkEmpty([username, password, phone]);
  if (isNotEmpty) {
    if (!checkUsername(username)) return res.json(jsondata("1002", "注册失败", "用户名格式错误"));
    if (!checkPassword(password)) return res.json(jsondata("1003", "注册失败", "密码格式错误"));
    if (!checkPhone(phone)) return res.json(jsondata("1004", "注册失败", "手机号格式错误"));
    if (!checkCaptcha(captchaCode)) return res.json(jsondata("1005", "注册失败", "验证码格式错误"));
  } else {
    return res.json(jsondata("1001", "注册失败", "表单数据不能为空"));
  }

  // 校验验证码
  const sql = "SELECT `captcha_code` FROM `captcha` WHERE `captcha_id`=? LIMIT 1";
  const result = await executeSql(sql, [captchaId]);
  if (result.length === 0) {
    return res.json(jsondata("1007", "注册失败", "验证码已失效"));
  }
  const dbCaptchaCode = result[0].captcha_code;
  if (dbCaptchaCode.toLowerCase() !== captchaCode.toLowerCase()) {
    return res.json(jsondata("1006", "注册失败", "验证码错误"));
  }
  next();
}

// 清除验证码记录
async function clearCaptcha(captchaId) {
  if (!captchaId) return;
  try {
    // 删除数据库中验证码记录
    const sql = "DELETE FROM `captcha` WHERE `captcha_id`=?";
    await executeSql(sql, [captchaId]);
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

// 插入refresh_token
async function insertRefreshToken(userID) {
  if (!userID) return;
  try {
    // 插入空的refresh_token记录，当用户登录成功后，会更新refresh_token
    const sql = "INSERT INTO `refresh_tokens` (`user_id`) VALUES (?)";
    await executeSql(sql, [userID]);
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

// 插入数据库
async function insertUser(req, res) {
  const { username, password, phone, captchaId } = req.body;
  // 哈希密码，同步方法
  const hashedPassword = bcrypt.hashSync(password, 10);

  let result = null;
  // 插入数据库
  const sql = "INSERT INTO `users` (`username`, `hashed_password`, `phone_number`) VALUES (?,?,?)";
  try {
    result = await executeSql(sql, [username, hashedPassword, phone]);
    const userID = result.insertId;
    // 插入refresh_token
    await insertRefreshToken(userID);
    // 注册成功，清除验证码记录，异步方法
    clearCaptcha(captchaId);
    // 注册成功，返回响应信息
    return res.json(jsondata("0000", "注册成功", result));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1002", `注册失败: ${error.message}`, error));
  }
}

// 查询用户名是否可用
router.get("/register/:username", async (req, res) => {
  const { username } = req.params;
  if (!checkEmpty([username])) {
    return res.json(jsondata("1001", "用户名不能为空", ""));
  }
  // 数据库查询
  const sql = "SELECT 1 FROM `users` WHERE `username`=? LIMIT 1";
  const result = await executeSql(sql, [username]);
  if (result.length > 0) {
    return res.json(jsondata("1004", "用户名已存在", ""));
  }
  return res.json(jsondata("0000", "用户名可用", ""));
});

// 注册账户
router.post("/register", checkData, insertUser);

export default router;
