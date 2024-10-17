// 结束未开始的志愿活动

import { executeSql } from "../../../utils/dbTools.js";
import jsondata from "../../../utils/jsondata.js";

// 单例模式，获取共享数据
// 如获取最近一次快结束的志愿活动时间，则可以直接从 singleton 中获取
import { getSingletonInstance, initSharedData } from "../singletonInstance.js";
// singleton.get()返回一个对象，包含最近一次快结束的志愿活动时间 lastEndTime
const singleton = await getSingletonInstance();
const sharedData = singleton.get();

// 只能结束未开始的志愿活动
async function endActivity(req, res) {
  const { id: activityId } = req.params;
  const sql = "UPDATE `volunteer_activities` SET `is_ended` = 1 WHERE `activity_id` =? AND `is_ended` = 0 AND `start_time` > NOW()";
  try {
    const result = await executeSql(sql, [activityId]);
    if (result.affectedRows === 0) {
      return res.json(jsondata("1002", "结束志愿活动失败", "活动不存在 or 活动已开始 or 活动已结束"));
    }
    // 如果结束的活动是最近一次快结束的活动，则更新 sharedData
    if (sharedData.lastActivityId === activityId) {
      // 异步更新 sharedData
      (async () => {
        const data = await initSharedData();
        sharedData.lastActivityId = data.activity_id;
        sharedData.lastEndTime = new Date(data.end_time).getTime();
      })();
    }
    return res.json(jsondata("0000", "结束志愿活动成功", ""));
  } catch (error) {
    // console.log(error);
    return res.json(jsondata("1001", `结束志愿活动失败: ${error.message}`, error));
  }
}

export default endActivity;
