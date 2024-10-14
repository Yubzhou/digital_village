// 编辑志愿活动

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

// 非空字段拼接
function getNotUndefinedFields(fields) {
  const notUndefinedFields = fields.filter((field) => field !== undefined);
  const fieldsStr = notUndefinedFields.join(" =?, ") + " =?";
  return { fieldsStr, notUndefinedFields };
}

async function editActivity(req, res) {
  const { id: activityId } = req.params;
  const { activity_name, activity_content, activity_location, number_of_recuits, contact_name, contact_phone, start_time, end_time } = req.body;
  const { fieldsStr, notUndefinedFields } = getNotUndefinedFields([activity_name, activity_content, activity_location, number_of_recuits, contact_name, contact_phone, start_time, end_time]);
  const sql = `UPDATE volunteer_activities SET ${fieldsStr} WHERE activity_id =? LIMIT 1`;
  try {
    const result = await executeSql(sql, [...notUndefinedFields, activityId]);
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
