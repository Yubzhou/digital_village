// 消息通知工具

// 导入数据库工具
import { executeSql, querySql } from "./dbTools.js";
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
function generateNotification(notificationType, itemId) {
  const [title, message] = ["", ""];
  switch (notificationType) {
    case NOTIFICATION_TYPE.E_PARTICIPATION:
      const itemTitle = findItemTitle("e_participation", itemId);
      title = "【问政回复】";
      message = `您发布的问政《${itemTitle}》已回复，快去看看吧！`;
      break;
    default:
      console.log("未知消息类型");
      throw new Error("未知消息类型");
  }
  return { title, message };
}

// 将users表的是否有新通知字段设为TRUE
async function updateUserHasNewNotification(userID) {
  try {
    const sql = "UPDATE `users` SET `has_new_notification`=TRUE WHERE `user_id`=?";
    await executeSql(sql, [userID]);
  } catch (error) {
    throw error;
  }
}

// 将消息通知存入数据库
async function saveNotification(userID, notificationType, itemId) {
  try {
    // 将消息通知存入数据库
    const { title, message } = generateNotification(notificationType, itemId);
    const sql = "INSERT INTO `notifications` (`user_id`, `notification_type`, `item_id`, `title`, `message`) VALUES (?,?,?,?,?)";
    const params = [userID, notificationType, itemId, title, message];
    await executeSql(sql, params);
    // 将users表的是否有新通知字段设为TRUE
    await updateUserHasNewNotification(userID);
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

// 根据配置获取查询方式（全部获取还是分页获取）
function getOptions(options) {
  // 默认分页配置
  const defaultOptions = {
    part: true,
    page: 1,
    size: 10,
  };
  let { part, page, size } = Object.assign(defaultOptions, options);
  part = part === "true";
  if (part) {
    page = parseInt(page);
    size = parseInt(size);
    const [offset, limit] = [(page - 1) * size, size];
    return { part, offset, limit };
  } else {
    return { part };
  }
}

// 获取用户的消息通知列表
async function getNotificationList(userID, options) {
  const { part, offset, limit } = getOptions(options);

  // 获取用户的消息通知总数
  const total = await getTotal(userID);
  try {
    // 查询数据库获取用户的通知, 按最新通知排序
    let result;
    if (part) {
      // 分页获取
      const sql = "SELECT * FROM `notifications` WHERE `user_id`=? ORDER BY `id` DESC LIMIT ?, ?";
      result = await querySql(sql, [userID, offset, limit]);
    } else {
      // 全部获取
      const sql = "SELECT * FROM `notifications` WHERE `user_id`=? ORDER BY `id` DESC";
      result = await executeSql(sql, [userID]);
    }
    // 返回查询结果
    return { total, list: result };
  } catch (error) {
    throw error;
  }
}

// 导出工具函数
export { saveNotification, getNotificationList };
