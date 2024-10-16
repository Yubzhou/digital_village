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

export { endActivities };
