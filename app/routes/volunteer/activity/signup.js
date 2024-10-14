// 报名志愿活动

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

async function signupActivity(req, res) {
  try {
    // 获取志愿者ID和活动ID
    const { activityID } = req.params;
    const { sub: volunteerID } = req.auth;
    const { self_introduction } = req.body;
    const sql = "INSERT INTO `volunteer_activity_registration` (activity_id, volunteer_id, self_introduction) VALUES (?,?,?)";
    // 向数据库插入数据
    const params = [activityID, volunteerID, self_introduction];
    const result = await executeSql(sql, params);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1002", "报名失败", ""));
    }
    return res.json(jsondata("0000", "报名成功", result));
  } catch (error) {
    // console.log(error);
    res.json(jsondata("1001", `服务器错误: ${error.message}`, error));
  }
}

export default signupActivity;
