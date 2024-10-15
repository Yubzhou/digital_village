// 编辑志愿活动

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

// 单例模式，获取共享数据
// 如获取最近一次快结束的志愿活动时间，则可以直接从 singleton 中获取
import { getSingletonInstance } from "./singletonInstance.js";
// singleton.get()返回一个对象，包含最近一次快结束的志愿活动时间 lastEndTime
const singleton = await getSingletonInstance();

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
      return res.json(jsondata("1002", "志愿活动修改失败", "活动不存在"));
    }
    // 更新最近一次快结束的志愿活动时间
    // 内部会自动进行比较判断，如果新发布的活动结束时间比之前的快结束时间更早，则更新 lastEndTime
    end_time && singleton.updateLastEndTime(end_time);
    return res.json(jsondata("0000", "志愿活动修改成功", ""));
  } catch (error) {
    // console.log(error);
    res.json(jsondata("1001", `志愿活动修改失败: ${error.message}`, error));
  }
}

export default editActivity;
