// 自动结束活动

import { executeSql } from "../../utils/dbTools.js";
import { endReview } from "./manage/endReview.js"; // 结束评审

// 单例模式，获取共享数据
// 如获取最近一次快结束的志愿活动时间，则可以直接从 singleton 中获取
import { getSingletonInstance } from "./singletonInstance.js";
// singleton.get()返回一个对象，包含最近一次快结束的志愿活动时间 lastEndTime
const singleton = await getSingletonInstance();
const sharedData = singleton.get();

// 更新志愿活动状态
async function endActivities() {
  // 查询所有未结束的活动
  let sql = "SELECT `activity_id` FROM `volunteer_activities` WHERE `end_time` <= NOW() AND `is_ended` = 0";
  let activityIds = await executeSql(sql);
  activityIds = activityIds.map((item) => item.activity_id);
  // 更新数据库中活动状态为已结束
  sql = "UPDATE `volunteer_activities` SET `is_ended` = 1 WHERE `end_time` <= NOW() AND `is_ended` = 0";
  const updateResult = await executeSql(sql);
  if (updateResult && updateResult.affectedRows > 0) {
    console.log("已更新快结束的志愿活动，数量为: ", updateResult.affectedRows);
  }
  // 异步结束评审
  endReview(activityIds);
}

// 更新 sharedData 的 lastEndTime
async function updateLastEndTime() {
  const sql = "SELECT `end_time` FROM `volunteer_activities` WHERE `is_ended` = 0 ORDER BY `end_time` ASC LIMIT 1";
  const result = await executeSql(sql);
  if (result.length > 0) {
    const endTime = new Date(result[0].end_time).getTime();
    sharedData.lastEndTime = endTime;
  }
}

// 自动结束志愿活动中间件
async function autoEndActivityMiddleware(req, res, next) {
  // 如果当前时间大于最近一次快结束的志愿活动时间，则触发结束函数
  if (Date.now() >= sharedData.lastEndTime) {
    // 若有快结束的志愿活动，则更新 sharedData
    await endActivities();
    await updateLastEndTime(); // 更新 sharedData 的 lastEndTime
  }
  next();
}

export default autoEndActivityMiddleware;
