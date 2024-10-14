// 发布投票活动

// 导入自定义模块
import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

async function publishActivity(req, res) {
  const { activity_name, activity_content, activity_cover, activity_location, number_of_recuits, contact_name, contact_phone, start_time, end_time } = req.body;
  const sql =
    "INSERT INTO `volunteer_activities` (`activity_name`, `activity_content`, `activity_cover`, `activity_location`, `number_of_recuits`, `contact_name`, `contact_phone`, `start_time`, `end_time`) VALUES (?,?,?,?,?,?,?,?,?)";
  const parmas = [activity_name, activity_content, activity_cover, activity_location, number_of_recuits, contact_name, contact_phone, start_time, end_time];
  try {
    const result = await executeSql(sql, parmas);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1002", "发布活动失败", ""));
    }
    return res.json(jsondata("0000", "发布活动成功", ""));
  } catch (error) {
    return res.json(jsondata("1001", `发布活动失败: ${error.message}`, error));
  }
}

export default publishActivity;
