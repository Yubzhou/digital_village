// 获取志愿者信息

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

// 获取用户参加志愿活动次数（成功完成的志愿活动）
async function getJoinTimes(userID) {
  const sql = "SELECT COUNT(*) AS count FROM `volunteer_activity_registration` WHERE `user_id` =? AND `status` = 4";
  try {
    const result = await executeSql(sql, [userID]);
    const serviceTimes = result?.[0]?.count ?? 0;
    return serviceTimes;
  } catch (error) {
    // console.error(error);
    throw error;
  }
}

// 加密隐私信息，info为对象类型
function encryptInfo(info) {
  // 定义删除字段
  const deleteFields = ["id_number"];
  // 定义隐私字段
  const privacyFields = ["phone_number"];
  // 遍历删除字段，删除对应字段
  for (const field of deleteFields) {
    if (info[field]) delete info[field];
  }
  // 遍历隐私字段，加密对应字段
  for (const field of privacyFields) {
    if (info[field]) info[field] = info[field].substring(0, 3) + "******" + info[field].substring(9);
  }
}

// 根据传入的fields数组（对应数据库字段），获取志愿者指定字段信息
// 如果未传fields，则默认返回所有字段信息
// 仅限开发者自己传入fields数组，不能用户输入，即用户不能调用此接口获取敏感信息
async function getInfo(req, res, fields) {
  let sql;
  // 如果未传入fields，则默认返回所有字段信息
  if (!fields) sql = "SELECT * FROM `volunteers` WHERE `user_id` =? LIMIT 1";
  // 否则只返回fields数组中的字段信息
  else sql = `SELECT ${fields.join(", ")} FROM volunteers WHERE user_id =? LIMIT 1`;
  try {
    const { sub: userID } = req.auth;
    const result = await executeSql(sql, [userID]);
    if (result.length === 0) {
      return res.json(jsondata("1002", "获取志愿者信息失败", "志愿者不存在"));
    }
    const info = result[0];
    // 加密隐私信息
    encryptInfo(info);
    // 获取志愿者参加志愿活动次数
    info.service_times = await getJoinTimes(userID);
    return res.json(jsondata("0000", "获取志愿者信息成功", info));
  } catch (error) {
    console.error(error);
    return res.json(jsondata("1001", `获取志愿者信息失败: ${error.message}`, error));
  }
}

export default getInfo;
