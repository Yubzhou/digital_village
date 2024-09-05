import express from "express";
import bcrypt from "bcryptjs";
import { executeSql } from "../utils/dbTools.js";
import { checkEmpty, checkAccount } from "../utils/checkData.js";
import jsondata from "../utils/jsondata.js";

// 导入jwtConfig配置文件
import jwtConfig from "../config/jwtConfig.js";

const router = express.Router();

// 根据账号查询用户信息
async function getUserByAccount(account) {
  // 判断用户输入的账号类型
  let sql;
  switch (checkAccount(account)) {
    case "username":
      sql = "SELECT * FROM `users` WHERE `username`=? LIMIT 1";
      break;
    case "phone":
      sql = "SELECT * FROM `users` WHERE `phone_number`=? LIMIT 1";
      break;
    case "email":
      sql = "SELECT * FROM `users` WHERE `email`=? LIMIT 1";
      break;
    default:
      throw new Error("账号类型错误");
  }
  try {
    // 数据库查询
    const result = await executeSql(sql, [account]);
    if (result.length === 0) throw new Error("账号不存在");
    return result[0];
  } catch (error) {
    throw error;
  }
}

// 生成token
async function generateToken(user_id, username) {
  // 生成的accessToken和refreshToken的签发时间一样
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: user_id, username, iat: now, exp: now + jwtConfig.ACCESS_TOKEN_EXPIRATION };
  const accessToken = jwt.sign(payload, jwtConfig.ACCESS_SECRET_KEY);
  // 为了防止生成的两个token一样，为refreshToken添加一个isRefresh字段
  payload.isRefresh = true;
  payload.exp = now + jwtConfig.REFRESH_TOKEN_EXPIRATION;
  const refreshToken = jwt.sign(payload, jwtConfig.REFRESH_SECRET_KEY);

  // 保存refreshToken到数据库
  sql = "INSERT INTO `refresh_tokens` (`user_id`, `iat`, `exp`) VALUES (?, ?, ?)";
  await executeSql(sql, [user.user_id, now, payload.exp]);

  // 返回带 Bearer 前缀的token
  return { accessToken: "Bearer " + accessToken, refreshToken: "Bearer " + refreshToken };
}

// 用户登录
router.post("/login", async (req, res) => {
  // 用户可以选择使用用户名、手机号或邮箱登录
  // 用户名只能为字母、数字、下划线，且长度在 4-20 之间，且不能以数字和下划线开头
  const { account, password } = req.body;

  if (!checkEmpty([account, password])) {
    return res.status(400).json(jsondata("1001", "用户名或密码不能为空", ""));
  }

  try {
    // 数据库查询
    const user = await getUserByAccount(account);
    // 验证密码, 同步方法
    const isMatch = bcrypt.compareSync(password, user.hashed_password);
    if (!isMatch) {
      return res.status(401).json(jsondata("1003", "密码错误", ""));
    }

    // 生成token
    const BearerTokens = await generateToken(user.user_id, user.username);
    // 登录成功
    res.json(jsondata("0000", "登录成功", { userID: user.user_id, username: user.username, tokens: BearerTokens }));
  } catch (error) {
    res.status(500).json(jsondata("1001", "登录失败", ""));
  }
});

export default router;
