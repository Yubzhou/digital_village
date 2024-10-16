// 活动结束后审核用户是否完成任务

import { executeSql } from "../../../utils/dbTools.js";

// 更新status状态
// 1: 审核中
// 2: 报名通过
// 3: 报名没通过
// 4: 已完成任务
// 5: 未完成任务
async function updateStatus(activityId) {
  // 将报名成功的用户状态设置为审核通过
  const sql = "UPDATE `volunteer_activity_registration` SET `status` = 4 WHERE `activity_id` =? AND `status` = 2";
  await executeSql(sql, [activityId]);
  // 将报名没通过的用户状态设置为审核不通过
  sql = "UPDATE `volunteer_activity_registration` SET `status` = 5 WHERE `activity_id` =? AND `status` = 3";
  await executeSql(sql, [activityId]);
}


// 更新用户志愿服务时长（单位：分钟）
async function updateServiceMinutes(activityId) {
  const sql = "UPDATE `volunteers` SET `service_minutes` = 0 WHERE `activity_id` =?";
  await executeSql(sql, [activityId]);
}



// 默认全部审核通过，后续根据实际情况调整
async function endReview(activityIds) {
  if (!activityIds || activityIds.length === 0) return;
    for (let i = 0; i < activityIds.length; i++) {
      await updateStatus(activityIds[i]);
    }
}


export { endReview };