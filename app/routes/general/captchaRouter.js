import express from "express";
import { executeSql } from "../../utils/dbTools.js";
import createCaptcha from "../../utils/general/captchaTools.js";
import jsondata from "../../utils/jsondata.js";

const router = express.Router();

// 获取图片验证码接口
router.post("/captcha", async (req, res) => {
  // 获取图片验证码ID
  let captchaId = req?.body?.captchaId || 0;
  // 验证图片验证码ID是否合法, 如果不为正整数，则置为0
  const isCaptchaIdValid = /^[1-9]\d*$/.test(captchaId);
  if (!isCaptchaIdValid) {
    captchaId = 0;
  }

  // 生成验证码
  const { data, text: captchaCode } = createCaptcha();
  try {
    // 如果数据库中存在该验证码ID，则更新数据库中的验证码
    const sql = "UPDATE `captcha` SET `captcha_code`=? WHERE `captcha_id`=?";
    const result = await executeSql(sql, [captchaCode, captchaId]);
    if (result.affectedRows === 0) {
      // 如果数据库中没有该验证码ID，则插入新验证码
      const sql = "INSERT INTO `captcha` (`captcha_code`) VALUES (?)";
      const result = await executeSql(sql, [captchaCode]);
      captchaId = result.insertId;
    }
    // 返回 验证码ID 和 验证码图片
    return res.json(jsondata("0000", "获取验证码成功", { captchaId, svg: data }));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1001", `获取验证码失败: ${error.message}`, error));
  }
});

export default router;
