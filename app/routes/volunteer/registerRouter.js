// 注册为志愿者路由
import express from "express";
import bcrypt from "bcryptjs";

import { executeSql } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";
// 导入验证数据函数
import { checkEmpty, checkPhone, checkPassword, checkIdCard, checkCaptcha } from "../../utils/checkData.js";

const router = express.Router();

// 从身份证号中获取出生日期
function getBirthdayFromIdCard(idCard) {
  const year = idCard.substring(6, 10);
  const month = idCard.substring(10, 12);
  const day = idCard.substring(12, 14);
  return `${year}-${month}-${day}`;
}

// 检查数据是否正确
async function checkData(req, res, next) {
  // 获取请求体数据（必须数据）
  const { phone_number, password, real_name, id_number, captchaId, captchaCode } = req.body;

  // 校验表单数据
  const isNotEmpty = checkEmpty([phone_number, password, real_name, id_number, captchaCode]);
  if (isNotEmpty) {
    if (!checkPhone(phone_number)) return res.json(jsondata("1002", "注册失败", "手机号格式错误"));
    if (!checkPassword(password)) return res.json(jsondata("1003", "注册失败", "密码格式错误"));
    const idCardStatus = checkIdCard(id_number);
    if (idCardStatus === 1) return res.json(jsondata("1004", "注册失败", "身份证号格式错误：身份证号需为18位"));
    else if (idCardStatus === 2) return res.json(jsondata("1005", "注册失败", "身份证号格式错误：出生日期格式错误"));
    if (!checkCaptcha(captchaCode)) return res.json(jsondata("1006", "注册失败", "验证码格式错误"));
  } else {
    return res.json(jsondata("1001", "注册失败", "表单数据不能为空"));
  }

  // 校验验证码
  const sql = "SELECT `captcha_code` FROM `captcha` WHERE `captcha_id`=? LIMIT 1";
  const result = await executeSql(sql, [captchaId]);
  if (result.length === 0) {
    return res.json(jsondata("1009", "注册失败", "验证码已失效"));
  }
  const dbCaptchaCode = result[0].captcha_code;
  if (dbCaptchaCode.toLowerCase() !== captchaCode.toLowerCase()) {
    return res.json(jsondata("1008", "注册失败", "验证码错误"));
  }
  // 校验完毕，从身份证号中获取出生日期、性别，并将出生日期格式化为YYYY-MM-DD格式，性别转换为数字（0为女，1为男）
  req.body.gender = parseInt(id_number[16]) % 2;
  req.body.birth_date = getBirthdayFromIdCard(id_number);
  // 放行到下一个中间件
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
async function insertRefreshToken(volunteerID) {
  if (!volunteerID) return;
  try {
    // 插入空的refresh_token记录，当用户(志愿者账号)登录成功后，会更新refresh_token
    const sql = "INSERT INTO `refresh_tokens_volunteers` (`volunteer_id`) VALUES (?)";
    await executeSql(sql, [volunteerID]);
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

// 根据身份证号生成志愿者编号
function generateVolunteerNumber(idNumber) {
  // 截取前6位
  const first6 = idNumber.substring(0, 6);
  // 获取当前时间戳的毫秒值，取前10位
  const middle10 = Date.now().toString().substring(0, 10);
  // 生成随机2位数字
  const last2 = Math.random().toString().substring(2, 4);
  // 合并字符串
  const volunteerNumber = first6 + middle10 + last2;
  return volunteerNumber;
}

async function insertVolunteerHandler(res, sql, params, id_number, captchaId) {
  let success = false;
  while (!success) {
    try {
      // 生成志愿者编号
      const volunteerNumber = generateVolunteerNumber(id_number);
      // 执行sql语句
      const result = await executeSql(sql, [...params, volunteerNumber]);
      const volunteerID = result.insertId;
      // 插入refresh_token
      await insertRefreshToken(volunteerID);
      // 注册成功，清除验证码记录，异步方法
      await clearCaptcha(captchaId);
      success = true; // 设置成功标志，跳出循环
      // 注册成功，返回响应信息
      return res.json(jsondata("0000", "注册成功", result));
    } catch (error) {
      console.error(error); // 记录错误到控制台
      if (error.code === "ER_DUP_ENTRY" && error.sqlMessage.includes("volunteers.volunteer_number_unique")) {
        // 如果是重复的志愿者编号错误，继续循环
        continue;
      }
      // 如果不是重复的志愿者编号错误，则抛出异常
      return res.json(jsondata("1001", `注册失败: ${error.message}`, error));
    }
  }
}

// 插入数据库
async function insertVolunteer(req, res) {
  const { phone_number, password, real_name, id_number, gender, birth_date, captchaId } = req.body;
  const school_or_workplace = req.body?.school_or_workplace || null;
  // 哈希密码，同步方法
  const hashedPassword = bcrypt.hashSync(password, 10);
  // 插入数据库
  const sql = "INSERT INTO `volunteers` (`phone_number`, `hashed_password`, `real_name`, `id_number`, `gender`, `birth_date`, `school_or_workplace`, `volunteer_number`) VALUES (?,?,?,?,?,?,?,?)";
  const params = [phone_number, hashedPassword, real_name, id_number, gender, birth_date, school_or_workplace];
  await insertVolunteerHandler(res, sql, params, id_number, captchaId);
}

// 查询账户（手机号）是否可用
router.get("/register/:phone", async (req, res) => {
  const { phone } = req.params;
  if (!checkEmpty([phone])) {
    return res.json(jsondata("1001", "手机号不能为空", ""));
  }
  try {
    // 数据库查询
    const sql = "SELECT 1 FROM `volunteers` WHERE `phone_number`=? LIMIT 1";
    const result = await executeSql(sql, [phone]);
    if (result.length > 0) {
      return res.json(jsondata("1002", "手机号已被注册", ""));
    }
    return res.json(jsondata("0000", "手机号可用", ""));
  } catch (error) {
    // console.error(error);
    return res.json(jsondata("1003", `查询失败: ${error.message}`, error));
  }
});

// 注册志愿者账号
router.post("/register", checkData, insertVolunteer);

export default router;
