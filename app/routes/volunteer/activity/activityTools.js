// 志愿活动工具

import { executeSql } from "../../../utils/dbTools.js";
import { endReview } from "../manage/endReview.js";

// 更新志愿活动状态
// 结束活动，传入活动 ID 数组，表示将这些活动标记为已结束
async function endActivities(activityIds) {
  if (!activityIds || activityIds.length === 0) return null;
  try {
    // 更新数据库中活动状态为已结束
    const sql = `UPDATE volunteer_activities SET is_ended = 1 WHERE activity_id IN (${activityIds.join(",")})`;
    const result = await executeSql(sql);
    // 异步结束评审
    endReview(activityIds);
    return result;
  } catch (error) {
    // console.error(error);
    throw error;
  }
}

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

export { endActivities };
