// 获取志愿活动列表

// 导入自定义模块
import jsondata from "../../../utils/jsondata.js";
import { getList } from "../../../utils/paginationTools.js";

// 根据filter参数生成baseSql语句
function generateBaseSql(filter) {
  let baseSql;
  switch (filter) {
    case "upcoming":
      baseSql = "SELECT * FROM `volunteer_activities` WHERE `is_ended` = 0 AND `start_time` > NOW() ORDER BY `activity_id` DESC";
      break;
    case "ongoing":
      baseSql = "SELECT * FROM `volunteer_activities` WHERE `is_ended` = 0 AND `start_time` < NOW() AND `end_time` > NOW() ORDER BY `activity_id` DESC";
      break;
    case "ended":
      baseSql = "SELECT * FROM `volunteer_activities` WHERE `is_ended` = 1 OR `end_time` <= NOW() ORDER BY `activity_id` DESC";
      break;
    case "all":
      baseSql = "SELECT * FROM `volunteer_activities` ORDER BY `activity_id` DESC";
      break;
    default:
      return null;
  }
  return baseSql;
}

async function getActivityList(req, res) {
  const { filter } = req.query;
  if (!filter) return res.json(jsondata("1002", "缺少参数 filter", "缺少筛选参数 filter"));
  const baseSql = generateBaseSql(filter);
  if (!baseSql) return res.json(jsondata("1003", "参数错误", "filter 参数错误，只能是 upcoming、ongoing、ended、all"));
  try {
    // req.query 包含分页参数，如：part、page、size
    const result = await getList(baseSql, req.query);
    return res.json(jsondata("0000", "获取活动列表成功", result));
  } catch (error) {
    return res.json(jsondata("1001", `获取活动列表失败: ${error.message}`, error));
  }
}

export default getActivityList;
