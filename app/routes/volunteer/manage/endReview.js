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
  let sql;
  // 查找完成志愿活动的用户（status = 4）
  sql = "SELECT `user_id` FROM `volunteer_activity_registration` WHERE `activity_id` = ? AND `status` = 4";
  let userIds = await executeSql(sql, [activityId]);
  userIds = userIds.map((item) => item.user_id); // 数组对象转换成数组整数

  if (userIds.length === 0) return; // 如果没有符合要求的用户，则直接返回

  // 获取该活动的志愿时长
  sql = "SELECT `end_time`, `start_time` FROM `volunteer_activities` WHERE `activity_id` = ? LIMIT 1";
  const [activity] = await executeSql(sql, [activityId]);
  const endTime = new Date(activity.end_time).getTime();
  const startTime = new Date(activity.start_time).getTime();
  const serviceMinutes = Math.floor((endTime - startTime) / 60000); // 单位：分钟

  // 更新志愿表里面用户的志愿服务时长（在原来时间上增加）
  sql = "UPDATE `volunteers` SET `service_minutes` = `service_minutes` + ? WHERE `user_id` IN (" + userIds.join(",") + ")";
  await executeSql(sql, [serviceMinutes]);
}

// 默认全部审核通过，后续根据实际情况调整
async function endReview(activityIds) {
  if (!activityIds || activityIds.length === 0) return;
  for (let i = 0; i < activityIds.length; i++) {
    await updateStatus(activityIds[i]); // 先更新完成状态
    await updateServiceMinutes(activityIds[i]); // 再更新志愿时长，因为志愿时长是根据完成状态来更新的
  }
}

export { endReview };
