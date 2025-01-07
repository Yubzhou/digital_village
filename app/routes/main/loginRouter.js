import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { executeSql } from "../../utils/dbTools.js";
import { checkEmpty, checkAccount } from "../../utils/checkData.js";
import jsondata from "../../utils/jsondata.js";

// 导入jwtConfig配置文件
import jwtConfig from "../../config/jwtConfig.js";

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
async function generateToken(user_id, username, isAdmin, isVolunteer) {
  // 生成的accessToken和refreshToken的签发时间一样
  // const now = jwtConfig.now(); // 使用东八区时间戳（默认单位为秒）
  const now = Math.floor(Date.now() / 1000); // 使用UTC当前时间戳（默认单位为秒）
  const payload = { sub: user_id, username, isAdmin, isVolunteer, iat: now, exp: now + jwtConfig.ACCESS_TOKEN_EXPIRATION };
  const accessToken = jwt.sign(payload, jwtConfig.ACCESS_SECRET_KEY);
  // 为了防止生成的两个token一样，为refreshToken添加一个isRefresh字段
  payload.isRefresh = true;
  payload.exp = now + jwtConfig.REFRESH_TOKEN_EXPIRATION;
  const refreshToken = jwt.sign(payload, jwtConfig.REFRESH_SECRET_KEY);

  // 保存refreshToken到数据库
  try {
    const sql = "UPDATE `refresh_tokens` SET `iat`=?, `exp`=? WHERE `user_id`=? LIMIT 1";
    await executeSql(sql, [now, payload.exp, user_id]);
  } catch (error) {
    // console.log(error);
    throw error;
  }
  // 返回token
  return { accessToken, refreshToken };
}

// 用户登录
router.post("/login", async (req, res) => {
  // 用户可以选择使用用户名、手机号或邮箱登录
  // 用户名只能为字母、数字、下划线，且长度在 4-20 之间，且不能以数字和下划线开头
  const { account, password } = req.body;

  if (!checkEmpty([account, password])) {
    return res.json(jsondata("1001", "账号或密码不能为空", ""));
  }

  try {
    // 数据库查询
    const user = await getUserByAccount(account);
    // 验证密码, 同步方法
    const isMatch = bcrypt.compareSync(password, user.hashed_password);
    if (!isMatch) {
      return res.json(jsondata("1003", "密码错误", ""));
    }

    // 生成token
    const BearerTokens = await generateToken(user.user_id, user.username, user.is_admin, user.is_volunteer);
    // 登录成功
    return res.json(
      jsondata("0000", "登录成功", {
        userID: user.user_id,
        username: user.username,
        isAdmin: user.is_admin,
        isVolunteer: user.is_volunteer,
        avatar: user.avatar,
        tokens: BearerTokens,
      })
    );
  } catch (error) {
    return res.json(jsondata("1001", `登录失败: ${error.message}`, error));
  }
});

// 根据user_id获取用户主要信息
async function getUserMainInfoByUserId(userID) {
  const sql = "SELECT * FROM `users` WHERE `user_id`=? LIMIT 1";
  const users = await executeSql(sql, [userID]);
  if (!users.length) throw new Error("用户不存在：用户ID无效");
  const user = users[0];
  return {
    userID: user.user_id,
    username: user.username,
    isAdmin: user.is_admin,
    isVolunteer: user.is_volunteer,
    avatar: user.avatar,
  };
}

// 校验用户是否已登录（根据用户的localStorage里面的accessToken和refreshToken判断）
router.post("/login/check", async (req, res) => {
  let accessToken, refreshToken; // 声明变量
  try {
    // 获取accessToken和refreshToken
    ({ accessToken, refreshToken } = req.body); // 解构赋值

    // 校验accessToken，token失效或解析失败会抛出异常
    const decoded = jwt.verify(accessToken, jwtConfig.ACCESS_SECRET_KEY);
    // 校验通过，返回登录状态
    const userMainInfo = await getUserMainInfoByUserId(decoded.sub);
    return res.json(jsondata("0000", "登录状态校验成功", { isLogin: true, ...userMainInfo }));
  } catch (error) {
    // 校验accessToken失败，尝试校验refreshToken
    try {
      // 校验refreshToken，token失效或解析失败会抛出异常
      const decoded = jwt.verify(refreshToken, jwtConfig.REFRESH_SECRET_KEY);
      // 如果refreshtoken有效，查询数据库校验
      const sql = "SELECT * FROM `refresh_tokens` WHERE `user_id`=? AND `iat`=? LIMIT 1";
      const result = await executeSql(sql, [decoded.sub, decoded.iat]);
      // 如果数据库中没有该用户的refreshToken，返回未登录状态
      if (!result.length) return res.json(jsondata("0000", "登录状态校验成功", { isLogin: false }));
      // 校验通过，返回登录状态
      const userMainInfo = await getUserMainInfoByUserId(decoded.sub);
      return res.json(jsondata("0000", "登录状态校验成功", { isLogin: true, ...userMainInfo }));
    } catch (error) {
      // 校验refreshToken失败，返回未登录状态
      return res.json(jsondata("0000", "登录状态校验成功", { isLogin: false }));
    }
  }
});

export default router;
