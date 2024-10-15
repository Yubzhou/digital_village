// 获取报名列表

import jsondata from "../../../utils/jsondata.js";
import { getList } from "../../../utils/paginationTools.js";

// 获取未开始的志愿活动表，按start_time升序排列
async function getUpcomingActivities() {
  const baseSql = "SELECT * FROM `volunteer_activities` WHERE `is_ended` = 0 AND `start_time` > NOW() ORDER BY `start_time` ASC";
  const result = await getList(baseSql, "volunteer_activities", { part: false }); // 不分页获取
  return result?.list || [];
}

// 按照最近快开始的志愿活动进行排序，并按活动id分组
function groupByActivity(activityIds, registerations) {
  // // 建立activity_id与index的映射，按照activityIds里面元素的顺序
  // const idMapping = {};
  // for (let i = 0; i < activityIds.length; i++) {
  //   idMapping[activity.activity_id] = i;
  // }
  const result = {};
  for (const activityId of activityIds) {
    result[activityId] = [];
  }
  for (const registeration of registerations) {
    const activityId = registeration.activity_id;
    result[activityId].push(registeration);
  }
  return result;
}

// 按照最近快开始的志愿活动进行排序，并按活动id分组返回报名信息
async function getSignUpList(req, res) {
  try {
    const upcomingActivities = await getUpcomingActivities();
    if (upcomingActivities.length === 0) {
      return res.json(jsondata("1002", "暂无待审核的报名信息", { upcomingActivities: [], groupedResult: {} }));
    }
    const activityIds = upcomingActivities.map((activity) => activity.activity_id);
    const baseSql = "SELECT * FROM `volunteer_activity_registration` WHERE `activity_id` IN (" + activityIds.join(",") + ")";
    const registerations = await getList(baseSql, "volunteer_activity_registration", { part: false }); // 不分页获取
    const groupedResult = groupByActivity(activityIds, registerations?.list || []);
    return res.json(jsondata("0000", "获取报名列表成功", { upcomingActivities, groupedResult }));
  } catch (error) {
    console.error(error);
    return res.json(jsondata("1001", `获取报名列表失败: ${error.message}`, error));
  }
}

export default getSignUpList;
