// 获取报名列表

import jsondata from "../../../utils/jsondata.js";
import { getList } from "../../../utils/paginationTools.js";
import { executeSql } from "../../../utils/dbTools.js";

// 获取哪些活动有新报名待审核
async function hasNewNotificationActivities() {
  try {
    const sql = "SELECT `activity_id`, COUNT(*) AS total FROM `volunteer_activity_registration` WHERE `status` = 1 GROUP BY `activity_id`;";
    const result = await executeSql(sql);
    const activityIds = result.filter((item) => item.total > 0).map((item) => item.activity_id);
    return activityIds;
  } catch (error) {
    throw error;
  }
}

// 获取活动列表，按发布时间降序排列
async function getActivityList(req, res) {
  try {
    const baseSql = "SELECT * FROM `volunteer_activities` ORDER BY `activity_id` DESC";
    const result = await getList(baseSql, req.query); // 根据配置参数决定是否分页获取
    const activityIds = await hasNewNotificationActivities();
    result.list.forEach((activity) => {
      activity.hasNewNotification = activityIds.includes(activity.activity_id);
    });
    return res.json(jsondata("0000", "获取活动列表成功", result));
  } catch (error) {
    console.error(error);
    return res.json(jsondata("1001", `获取活动列表失败: ${error.message}`, error));
  }
}

// 根据用户报名信息获取对应的用户志愿者信息
async function getVolunteerInfos(users) {
  if (!users || users.length === 0) return;
  const userIds = users.map((user) => user.user_id);
  const sql = "SELECT * FROM `volunteers` WHERE `user_id` IN (" + userIds.join(",") + ")";
  const result = await executeSql(sql);
  // 合并用户信息
  for (const user of users) {
    const volunteer = result.find((item) => item.user_id === user.user_id);
    // 将志愿者信息合并到用户信息中
    delete volunteer.id; // 隐藏志愿者表的无关自增键
    delete volunteer.id_number; // 隐藏身份证号码
    Object.assign(user, volunteer);
  }
}

// 查看指定活动的人员报名信息
async function getRegistrationList(req, res) {
  try {
    const activityId = req.params.activityId;
    const sql = "SELECT `id`, `activity_id`, `user_id`, `status`, `self_introduction` FROM `volunteer_activity_registration` WHERE `activity_id` =?";
    const total = await executeSql("SELECT COUNT(*) AS total FROM `volunteer_activity_registration` WHERE `activity_id` =?", [activityId]);
    const list = await executeSql(sql, [activityId]);
    await getVolunteerInfos(list);
    const result = { total: total?.[0]?.total ?? 0, list };
    return res.json(jsondata("0000", "获取报名列表成功", result));
  } catch (error) {
    console.error(error);
    return res.json(jsondata("1001", `获取报名列表失败: ${error.message}`, error));
  }
}

export { getActivityList, getRegistrationList };
