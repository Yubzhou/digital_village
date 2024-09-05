import express from "express";
import pool from "../config/dbConfig.js";
import createCaptcha from "../utils/captchaTools.js";

const router = express.Router();

// 获取图片验证码接口
router.get("/captcha", async (req, res) => {
  // 获取会话ID，需要导入cookie-parser中间件（根目录下的index.js里面已经配置）
  let captchaId = req?.cookies?.captchaId;

  // 生成验证码
  const { data, text: code } = createCaptcha();
  if (captchaId) {
    // 如果有会话ID, 则更新数据库中的验证码
    const sql = "UPDATE `captcha` SET `code`=? WHERE `captcha_id`=?";
    await pool.execute(sql, [code, captchaId]);
  } else {
    // 如果没有会话ID, 将验证码保存到数据库, 并记录下会话ID
    const sql = "INSERT INTO `captcha` (`code`) VALUES (?)";
    const [result] = await pool.execute(sql, [code]);
    captchaId = result.insertId;
  }
  // 将会话ID保存到cookie中, 并且设置httpOnly属性, 禁止客户端修改; 并且设置sameSite属性为Lax, 防止跨域攻击; 设置secure属性为true, 强制使用https加密传输。
  res.cookie("captchaId", captchaId, { path: "/", httpOnly: true, sameSite: "none", secure: true });
  // 设置响应类型为 SVG, 返回验证码图片
  res.type("image/svg+xml").send(data);
});

export default router;
