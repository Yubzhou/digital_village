// 发布投票活动

// 导入自定义模块
import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

// 单例模式，获取共享数据
// 如获取最近一次快结束的志愿活动时间，则可以直接从 singleton 中获取
import { getSingletonInstance } from "../singletonInstance.js";
// singleton.get()返回一个对象，包含最近一次快结束的志愿活动时间 lastEndTime
const singleton = await getSingletonInstance();

// 生成活动编号（13位，以 V 开头，后面跟着时间戳（单位为秒），最后两位随机数）
function generateActivityNumber() {
  const timestampStr = Date.now().toString().substring(0, 10);
  const suffix = Math.random().toString().substring(2, 4);
  return `V${timestampStr}${suffix}`;
}

// 发布活动助手
async function publishActivityHandler(res, sql, parmas, end_time) {
  let success = false;
  while (!success) {
    try {
      // 生成活动编号
      const activityNumber = generateActivityNumber();
      // 执行sql语句
      const result = await executeSql(sql, [activityNumber, ...parmas]);
      success = true; // 设置成功标志，跳出循环
      if (result.affectedRows === 0) {
        return res.json(jsondata("1002", "发布活动失败", ""));
      }
      // 更新最近一次快结束的志愿活动时间
      singleton.updateLastEndTime(end_time); // 内部会自动进行比较判断，如果新发布的活动结束时间比之前的快结束时间更早，则更新 lastEndTime
      // 注册成功，返回响应信息
      return res.json(jsondata("0000", "发布活动成功", { activityID: result.insertId, result }));
    } catch (error) {
      console.error(error); // 记录错误到控制台
      if (error.code === "ER_DUP_ENTRY" && error.sqlMessage.includes("volunteer_activities.activity_number_unique")) {
        // 如果是重复的活动编号错误，继续循环
        continue;
      }
      // 如果不是重复的活动编号错误，则抛出异常
      return res.json(jsondata("1001", `发布活动失败: ${error.message}`, error));
    }
  }
}

async function publishActivity(req, res) {
  const { activity_name, activity_content, activity_location, number_of_recruits, contact_name, contact_phone, start_time, end_time } = req.body;
  const sql =
    "INSERT INTO `volunteer_activities` (`activity_number`, `activity_name`, `activity_content`, `activity_location`, `number_of_recruits`, `contact_name`, `contact_phone`, `start_time`, `end_time`) VALUES (?,?,?,?,?,?,?,?,?)";
  const parmas = [activity_name, activity_content, activity_location, number_of_recruits, contact_name, contact_phone, start_time, end_time];
  await publishActivityHandler(res, sql, parmas, end_time);
}

export default publishActivity;
