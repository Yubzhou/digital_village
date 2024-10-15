// 获取志愿活动列表

// 导入自定义模块
import jsondata from "../../../utils/jsondata.js";
import { getList } from "../../../utils/paginationTools.js";
import { endActivities } from "./activityTools.js";

// 单例模式，获取共享数据
// 如获取最近一次快结束的志愿活动时间，则可以直接从 singleton 中获取
import { getSingletonInstance } from "./singletonInstance.js";
// singleton.get()返回一个对象，包含最近一次快结束的志愿活动时间 lastEndTime
const singleton = await getSingletonInstance();
const sharedData = singleton.get();

// 筛选未结束活动和已结束活动，参数 activities 为数据库查询结果，格式为数组
function filterActivities(activities) {
  if (!activities) return { endList: [], notEndList: [], ids: [] };
  const endList = [];
  const notEndList = [];
  const ids = []; // 保存活动已过期但状态为未结束的活动 id
  const now = Date.now();
  let lastEndTime = Infinity;
  for (let activity of activities) {
    const endTime = new Date(activity.end_time).getTime();
    if (endTime <= now || activity.is_ended === 1) {
      // 已结束活动
      endList.push(activity);
      // 记录已过期但状态为未结束的活动 id
      if (activity.is_ended === 0) ids.push(activity.activity_id);
    } else {
      // 未结束活动
      notEndList.push(activity);
      // 记录最近一次快结束的志愿活动时间
      if (endTime < lastEndTime) lastEndTime = endTime;
    }
  }
  // 更新 sharedData的 lastEndTime
  if (lastEndTime !== Infinity) sharedData.lastEndTime = lastEndTime;
  return { endList, notEndList, ids };
}

async function getActivityList(req, res) {
  try {
    const baseSql = "SELECT * FROM `volunteer_activities` ORDER BY `activity_id` DESC";
    // req.query 包含分页参数，如：part、page、size
    const result = await getList(baseSql, "volunteer_activities", req.query);
    // 筛选未结束活动和已结束活动，以及获取已过期但状态为未结束的活动 id
    const { endList, notEndList, ids } = filterActivities(result?.list);
    // 如果当前时间大于最近一次快结束的志愿活动时间，则触发结束函数
    if (Date.now() >= sharedData.lastEndTime) {
      // 若有快结束的志愿活动，则更新 sharedData
      const updateResult = await endActivities(ids);
      if (updateResult.affectedRows > 0) {
        console.log("已更新快结束的志愿活动，数量为: ", updateResult.affectedRows);
      }
    }
    return res.json(jsondata("0000", "获取活动列表成功", { endList, notEndList }));
  } catch (error) {
    return res.json(jsondata("1001", `获取活动列表失败: ${error.message}`, error));
  }
}

export default getActivityList;
