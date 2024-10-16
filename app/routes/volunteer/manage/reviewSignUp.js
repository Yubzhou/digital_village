// 审核报名信息

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";
// 导入消息通知工具
import { saveNotification } from "../../../utils/volunteer/notificationTools.js";
// 导入配置文件
import { NOTIFICATION_TYPE } from "../../../config/config.js";

// 将审核消息通知给报名者
async function notifySignUp(userID, activityId, status) {
  // 通知用户，并且插入通知记录到通知表
  await saveNotification(userID, NOTIFICATION_TYPE.VOLUNTEER_REVIEW, activityId, status);
}

// 审核报名通过更新该活动的当前招募人数
async function updateActivityRecruitCount(activityId) {
  const sql = "UPDATE `volunteer_activities` SET `current_number_of_recruits` = `current_number_of_recruits` + 1 WHERE `activity_id` =?";
  try {
    await executeSql(sql, [activityId]);
  } catch (error) {
    console.log(`更新活动${activityId}招募人数失败: ${error.message}`);
  }
}

// 审核报名信息
async function reviewSignUp(req, res) {
  const { id } = req.params;
  const { activity_id, user_id, status } = req.body;
  if (![2, 3].includes(status)) {
    return res.json(jsondata("1002", "审核失败", "请选择审核状态: 2-通过, 3-拒绝"));
  }
  const sql = "UPDATE `volunteer_activity_registration` SET `status` =? WHERE `id` =?";
  try {
    const result = await executeSql(sql, [status, id]);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1003", "审核失败", "未找到该报名信息"));
    }
    // 如果审核通过，则异步更新活动的当前招募人数
    if (status === 2) {
      updateActivityRecruitCount(activity_id);
    }
    // 审核完成，异步通知报名者
    notifySignUp(user_id, activity_id, status);
    return res.json(jsondata("0000", "审核成功", ""));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1001", `审核失败: ${error.message}`, error));
  }
}

export default reviewSignUp;
