import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { executeSql } from "../../utils/dbTools.js";
import { checkEmpty } from "../../utils/checkData.js";
import jsondata from "../../utils/jsondata.js";

// 导入jwtConfig配置文件
import jwtConfig from "../../config/jwtConfig.js";

const router = express.Router();

// 根据账号（手机号）查询志愿者信息
async function getUserByPhone(phone) {
  const sql = "SELECT * FROM `volunteers` WHERE `phone_number`=? LIMIT 1";
  try {
    // 数据库查询
    const result = await executeSql(sql, [phone]);
    if (result.length === 0) throw new Error("账号不存在");
    return result[0];
  } catch (error) {
    throw error;
  }
}

// 生成token
async function generateToken(volunteerID, isAdmin) {
  // 生成的accessToken和refreshToken的签发时间一样
  // const now = jwtConfig.now(); // 使用东八区时间戳（默认单位为秒）
  const now = Math.floor(Date.now() / 1000); // 使用UTC当前时间戳（默认单位为秒，因为jsonwebtoken默认使用UTC时间且以秒为单位）
  const payload = { sub: volunteerID, isAdmin, iat: now, exp: now + jwtConfig.ACCESS_TOKEN_EXPIRATION };
  const accessToken = jwt.sign(payload, jwtConfig.ACCESS_SECRET_KEY);
  // 为了防止生成的两个token一样，为refreshToken添加一个isRefresh字段
  payload.isRefresh = true;
  payload.exp = now + jwtConfig.REFRESH_TOKEN_EXPIRATION;
  const refreshToken = jwt.sign(payload, jwtConfig.REFRESH_SECRET_KEY);

  // 保存refreshToken到数据库
  try {
    const sql = "UPDATE `refresh_tokens_volunteers` SET `iat`=?, `exp`=? WHERE `volunteer_id`=? LIMIT 1";
    await executeSql(sql, [now, payload.exp, volunteerID]);
  } catch (error) {
    // console.log(error);
    throw error;
  }
  // 返回token
  return { accessToken, refreshToken };
}

// 用户登录
router.post("/login", async (req, res) => {
  // 志愿者只能使用手机号登录
  const { phone, password } = req.body;

  if (!checkEmpty([phone, password])) {
    return res.json(jsondata("1001", "账号或密码不能为空", ""));
  }

  try {
    // 数据库查询
    const volunteer = await getUserByPhone(phone);
    // 验证密码, 同步方法
    const isMatch = bcrypt.compareSync(password, volunteer.hashed_password);
    if (!isMatch) {
      return res.json(jsondata("1002", "密码错误", ""));
    }

    // 生成tokens
    const tokens = await generateToken(volunteer.volunteer_id, volunteer.is_admin);
    // 登录成功
    return res.json(jsondata("0000", "登录成功", { volunteerID: volunteer.volunteer_id, realName: volunteer.real_name, isAdmin: volunteer.is_admin, tokens }));
  } catch (error) {
    return res.json(jsondata("1003", `登录失败: ${error.message}`, error));
  }
});

export default router;
