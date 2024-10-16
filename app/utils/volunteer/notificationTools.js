// 消息通知工具

// 导入自定义工具
import { executeSql } from "../dbTools.js";
// 导入配置
import { NOTIFICATION_TYPE } from "../../config/config.js";

// 查找activityId活动名字
async function findItemTitle(activityId) {
  try {
    // 根据activityId查找活动名字
    const sql = "SELECT `activity_name` FROM `volunteer_activities` WHERE `activity_id`=?";
    const result = await executeSql(sql, [activityId]);
    return result.length > 0 ? result?.[0]?.activity_name ?? "" : "";
  } catch (error) {
    throw error;
  }
}

// 生成消息通知
async function generateNotification(notificationType, activityId, status) {
  let [title, message] = ["", ""];
  switch (notificationType) {
    case NOTIFICATION_TYPE.VOLUNTEER_REVIEW:
      const activityName = await findItemTitle(activityId);
      title = "【志愿活动报名审核结果】";
      message = `您报名的志愿活动《${activityName}》的申请已被${status === 2 ? "通过" : "拒绝"}，快去看看吧！`;
      break;
    default:
      console.log("未知消息类型");
  }
  return { title, message };
}

// 更新users表的是否有新通知字段
async function updateUserHasNewNotification(userID, hasNewNotification) {
  try {
    const sql = "UPDATE `users` SET `has_new_notification`=? WHERE `user_id`=?";
    await executeSql(sql, [hasNewNotification, userID]);
  } catch (error) {
    throw error;
  }
}

// 将消息通知存入数据库
async function saveNotification(userID, notificationType, activityId, status) {
  try {
    // 将消息通知存入数据库
    const { title, message } = await generateNotification(notificationType, activityId, status);
    // 如果数据库中已存在相同的通知记录，则更新通知内容
    const sql = `
      INSERT INTO notifications (user_id, notification_type, item_id, title, message) 
      VALUES (?,?,?,?,?) 
      ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      message = VALUES(message),
      time = CURRENT_TIMESTAMP(),
      is_read = FALSE;
    `;
    const params = [userID, notificationType, activityId, title, message];
    await executeSql(sql, params);

    // 将users表的是否有新通知字段设为TRUE
    await updateUserHasNewNotification(userID, true);
  } catch (error) {
    throw error;
  }
}

// 导出工具函数
export { saveNotification, updateUserHasNewNotification };
