// 获取志愿者信息

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

// 根据传入的fields数组（对应数据库字段），获取志愿者指定字段信息
// 仅限开发者自己传入fields数组，不能用户输入，即用户不能调用此接口获取敏感信息
async function getInfo(req, res, fields) {
  try {
    const { sub: volunteerID } = req.auth;
    const sql = `SELECT ${fields.join(", ")} FROM volunteers WHERE volunteer_id =? LIMIT 1`;
    const result = await executeSql(sql, [volunteerID]);
    if (result.length === 0) {
      return res.json(jsondata("1002", "获取志愿者信息失败", "志愿者不存在"));
    }
    return res.json(jsondata("0000", "获取志愿者信息成功", result[0]));
  } catch (error) {
    console.error(error);
    return res.json(jsondata("1001", `获取志愿者信息失败: ${error.message}`, error));
  }
}

export default getInfo;