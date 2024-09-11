import express from "express";
import jwt from "jsonwebtoken";

import { executeSql } from "../utils/dbTools.js";
import jsondata from "../utils/jsondata.js";

// 导入jwtConfig配置文件
import jwtConfig from "../config/jwtConfig.js";

const router = express.Router();

// 刷新AccessToken
router.post("/refresh", async (req, res) => {
  // 从请求头中获取refreshToken
  const refreshToken = req.body.refreshToken;

  try {
    const decoded = jwt.verify(refreshToken, jwtConfig.REFRESH_SECRET_KEY);
    const result = await executeSql("SELECT * FROM `refresh_tokens` WHERE `user_id`=? AND `iat`=? LIMIT 1", [decoded.sub, decoded.iat]);

    if (!result.length || !decoded) {
      return res.status(401).json(jsondata("1001", "无效的刷新令牌", "Invalid refresh token"));
    }

    // 新生成的AccessToken和RefreshToken的签发时间一样
    // const now = jwtConfig.now(); // 使用东八区时间戳（默认单位为秒）
    const now = Math.floor(Date.now() / 1000); // 使用UTC当前时间戳（默认单位为秒）
    const payload = { sub: decoded.sub, username: decoded.username, isAdmin: decoded.isAdmin, iat: now, exp: now + jwtConfig.ACCESS_TOKEN_EXPIRATION };
    const newAccessToken = jwt.sign(payload, jwtConfig.ACCESS_SECRET_KEY);
    // 为了防止生成的两个token一样，为refreshToken添加一个isRefresh字段
    payload.isRefresh = true;
    payload.exp = now + jwtConfig.REFRESH_TOKEN_EXPIRATION;
    const newRefreshToken = jwt.sign(payload, jwtConfig.REFRESH_SECRET_KEY);

    // 保存RefreshToken到数据库
    await executeSql("UPDATE `refresh_tokens` SET `iat`=?, `exp`=? WHERE `user_id`=?", [now, payload.exp, decoded.sub]);
    // const decodedNewRefreshToken = jwt.decode(newRefreshToken);
    // console.log(decodedNewRefreshToken);
    // console.log(decodedNewRefreshToken.exp - decodedNewRefreshToken.iat);

    // 返回新的AccessToken和RefreshToken
    return res.json(jsondata("0000", "刷新成功", { tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken } }));
  } catch (error) {
    // console.log(error);
    if (error.name === "TokenExpiredError") {
      return res.status(500).json(jsondata("1001", "TokenExpiredError: 登录已过期, 请重新登录", error));
    } else if (error.name === "JsonWebTokenError") {
      return res.status(500).json(jsondata("1002", "JsonWebTokenError", error));
    } else if (error.name === "NotBeforeError") {
      return res.status(500).json(jsondata("1003", "NotBeforeError: jwt未激活", error));
    }
  }
});

// 注销
router.post("/logout", async (req, res) => {
  // 从请求头中获取用户id
  const { sub: userID } = req.auth;
  try {
    await executeSql("DELETE FROM `refresh_tokens` WHERE `user_id`=? LIMIT 1", [userID]);
    return res.json(jsondata("0000", "注销成功", ""));
  } catch (error) {
    // console.error(error);
    return res.status(500).json(jsondata("1001", "注销失败", error));
  }
});

export default router;
