// 消息通知工具

// 导入自定义工具
import { executeSql, querySql } from "./dbTools.js";
import getOptions from "./paginationTools.js";
// 导入配置
import { NOTIFICATION_TYPE } from "../config/config.js";

// 查找itemId文章标题
async function findItemTitle(tableName, itemId) {
  try {
    // 根据itemId查找文章标题
    const sql = `SELECT title FROM ${tableName} WHERE id=?`;
    const result = await executeSql(sql, [itemId]);
    return result.length > 0 ? result[0].title : "";
  } catch (error) {
    throw error;
  }
}

// 生成消息通知
async function generateNotification(notificationType, itemId) {
  let [title, message] = ["", ""];
  switch (notificationType) {
    case NOTIFICATION_TYPE.E_PARTICIPATION:
      const itemTitle = await findItemTitle("e_participation", itemId);
      title = "【问政回复】";
      message = `您发布的问政《${itemTitle}》已回复，快去看看吧！`;
      break;
    default:
      console.log("未知消息类型");
      throw new Error("未知消息类型");
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
async function saveNotification(userID, notificationType, itemId) {
  try {
    // 将消息通知存入数据库
    const { title, message } = await generateNotification(notificationType, itemId);
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
    const params = [userID, notificationType, itemId, title, message];
    const result = await executeSql(sql, params);

    // 将users表的是否有新通知字段设为TRUE
    await updateUserHasNewNotification(userID, true);
  } catch (error) {
    throw error;
  }
}

// 获取用户的消息通知总数
async function getTotal(userID) {
  try {
    const sql = "SELECT COUNT(*) AS total FROM `notifications` WHERE `user_id`=?";
    const result = await executeSql(sql, [userID]);
    return result.length > 0 ? result[0].total : 0;
  } catch (error) {
    throw error;
  }
}

// 获取用户的全部消息通知
async function getAllNotificationList(userID) {
  try {
    // 查询数据库获取用户的通知, 按最新通知排序
    const sql = "SELECT * FROM `notifications` WHERE `user_id`=? ORDER BY `id` DESC";
    const result = await executeSql(sql, [userID]);
    // 返回查询结果
    return { total: result.length, list: result };
  } catch (error) {
    throw error;
  }
}

// // 获取用户的消息通知列表
// async function getNotificationList(userID, options) {
//   const { part, offset, limit } = getOptions(options);

//   // 获取用户的消息通知总数
//   const total = await getTotal(userID);
//   try {
//     // 查询数据库获取用户的通知, 按最新通知排序
//     let result;
//     if (part) {
//       // 分页获取
//       const sql = "SELECT * FROM `notifications` WHERE `user_id`=? ORDER BY `id` DESC LIMIT ?, ?";
//       result = await querySql(sql, [userID, offset, limit]);
//     } else {
//       // 全部获取
//       const sql = "SELECT * FROM `notifications` WHERE `user_id`=? ORDER BY `id` DESC";
//       result = await executeSql(sql, [userID]);
//     }
//     // 返回查询结果
//     return { total, list: result };
//   } catch (error) {
//     throw error;
//   }
// }

// 先获取用户的全部消息通知再筛选，对于未读消息获取全部，对于已读消息则按分页配置获取最新通知
async function getNotificationList(userID, options) {
  const { part, offset, limit } = getOptions(options);

  try {
    // 获取用户全部的消息通知
    const { total, list } = await getAllNotificationList(userID);
    const [readList, unreadList] = [[], []];
    for (const item of list) {
      if (item.is_read) {
        // 筛选已读消息
        readList.push(item);
      } else {
        // 筛选未读消息
        unreadList.push(item);
      }
    }
    if (part) {
      // 按分页配置获取最新的已读通知
      const readListPart = readList.slice(offset, offset + limit);
      return { total, unreadList, readList: readListPart };
    } else {
      // 全部获取已读通知
      return { total, unreadList, readList };
    }
  } catch (error) {
    throw error;
  }
}

// 导出工具函数
export { saveNotification, getNotificationList, updateUserHasNewNotification };
