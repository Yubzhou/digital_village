// 获取志愿活动列表

// 导入自定义模块
import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";
import { getList } from "../../../utils/paginationTools.js";
import { endActivities } from "./activityTools.js"; // 将活动状态标记为已结束, 并自动审核结束（异步）

// 单例模式，获取共享数据
// 如获取最近一次快结束的志愿活动时间，则可以直接从 singleton 中获取
import { getSingletonInstance } from "./singletonInstance.js";
// singleton.get()返回一个对象，包含最近一次快结束的志愿活动时间 lastEndTime
const singleton = await getSingletonInstance();
const sharedData = singleton.get();

// 更新 sharedData 的 lastEndTime
async function updateLastEndTime() {
  const sql = "SELECT `end_time` FROM `volunteer_activities` WHERE `is_ended` = 0 ORDER BY `end_time` ASC LIMIT 1";
  const result = await executeSql(sql);
  if (result.length > 0) {
    const endTime = new Date(result[0].end_time).getTime();
    sharedData.lastEndTime = endTime;
  }
}

async function getActivityList(req, res) {
  try {
    const baseSql = "SELECT * FROM `volunteer_activities` ORDER BY `activity_id` DESC";
    // req.query 包含分页参数，如：part、page、size
    const result = await getList(baseSql, "volunteer_activities", req.query);
    // 如果当前时间大于最近一次快结束的志愿活动时间，则触发结束函数
    if (Date.now() >= sharedData.lastEndTime) {
      // 若有快结束的志愿活动，则更新 sharedData
      await endActivities();
      await updateLastEndTime(); // 更新 sharedData 的 lastEndTime
    }
    return res.json(jsondata("0000", "获取活动列表成功", result));
  } catch (error) {
    return res.json(jsondata("1001", `获取活动列表失败: ${error.message}`, error));
  }
}

export default getActivityList;
