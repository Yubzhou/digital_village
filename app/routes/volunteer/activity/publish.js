// 发布投票活动

// 导入自定义模块
import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

// 单例模式，获取共享数据
// 如获取最近一次快结束的志愿活动时间，则可以直接从 singleton 中获取
import { getSingletonInstance } from "./singletonInstance.js";
// singleton.get()返回一个对象，包含最近一次快结束的志愿活动时间 lastEndTime
const singleton = await getSingletonInstance();

async function publishActivity(req, res) {
  const { activity_name, activity_content, activity_location, number_of_recruits, contact_name, contact_phone, start_time, end_time } = req.body;
  const sql =
    "INSERT INTO `volunteer_activities` (`activity_name`, `activity_content`, `activity_location`, `number_of_recruits`, `contact_name`, `contact_phone`, `start_time`, `end_time`) VALUES (?,?,?,?,?,?,?,?)";
  const parmas = [activity_name, activity_content, activity_location, number_of_recruits, contact_name, contact_phone, start_time, end_time];
  try {
    const result = await executeSql(sql, parmas);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1002", "发布活动失败", ""));
    }
    // 更新最近一次快结束的志愿活动时间
    singleton.updateLastEndTime(end_time); // 内部会自动进行比较判断，如果新发布的活动结束时间比之前的快结束时间更早，则更新 lastEndTime
    return res.json(jsondata("0000", "发布活动成功", { activityID: result.insertId, result }));
  } catch (error) {
    return res.json(jsondata("1001", `发布活动失败: ${error.message}`, error));
  }
}

export default publishActivity;
