// 编辑志愿活动

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

async function editActivity(req, res) {
  const { id: activityId } = req.params;
  const { activity_name, activity_content, activity_cover, activity_location, number_of_recuits, contact_name, contact_phone, start_time, end_time } = req.body;
  const sql =
    "UPDATE `volunteer_activities` SET `activity_name` =?, `activity_content` =?, `activity_cover` =?, `activity_location` =?, `number_of_recuits` =?, `contact_name` =?, `contact_phone` =?, `start_time` =?, `end_time` =? WHERE `activity_id` =? LIMIT 1";
  try {
    const result = await executeSql(sql, [activity_name, activity_content, activity_cover, activity_location, number_of_recuits, contact_name, contact_phone, start_time, end_time, activityId]);
    if (result.affectedRows === 0) {
      res.json(jsondata("1002", "志愿活动修改失败", "活动不存在"));
    } else {
      res.json(jsondata("0000", "志愿活动修改成功", ""));
    }
  } catch (error) {
    // console.log(error);
    res.json(jsondata("1001", `志愿活动修改失败: ${error.message}`, error));
  }
}

export default editActivity;