import express from "express";
import pool from "../config/dbConfig.js";
import createCaptcha from "../utils/captchaTools.js";
import jsondata from "../utils/jsondata.js";

const router = express.Router();

// 获取图片验证码接口
router.post("/captcha", async (req, res) => {
  // 获取图片验证码ID
  let captchaId = req?.body?.captchaId;

  // 生成验证码
  const { data, text: captchaCode } = createCaptcha();
  if (captchaId) {
    // 如果有会话ID, 则更新数据库中的验证码
    const sql = "UPDATE `captcha` SET `captcha_code`=? WHERE `captcha_id`=?";
    await pool.execute(sql, [captchaCode, captchaId]);
  } else {
    // 如果没有会话ID, 将验证码保存到数据库, 并记录下会话ID
    const sql = "INSERT INTO `captcha` (`captcha_code`) VALUES (?)";
    const [result] = await pool.execute(sql, [captchaCode]);
    captchaId = result.insertId;
  }

  // 返回 验证码ID 和 验证码图片
  return res.json(jsondata("0000", "获取验证码成功", { captchaId, svg: data }));
});

export default router;
