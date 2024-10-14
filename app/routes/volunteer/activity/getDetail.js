// 获取志愿活动详情

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

async function getActivityDetail(req, res) {
  try {
    const { id: activityId } = req.params;
    const sql = "SELECT * FROM `volunteer_activities` WHERE `activity_id`=? LIMIT 1";
    const result = await executeSql(sql, [activityId]);
    if (result.length === 0) {
      res.json(jsondata("1002", "志愿活动获取失败", "志愿活动不存在"));
      return;
    }
    res.json(jsondata("0000", "志愿活动获取成功", result[0]));
  } catch (error) {
    // console.log(error);
    res.json(jsondata("1001", `志愿活动获取失败: ${error.message}`, error));
  }
}

export default getActivityDetail;
