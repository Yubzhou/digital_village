// 获取志愿活动列表

// 导入自定义模块
import jsondata from "../../../utils/jsondata.js";
import { getList } from "../../../utils/paginationTools.js";

async function getActivityList(req, res) {
  try {
    const baseSql = "SELECT * FROM `volunteer_activities` ORDER BY `activity_id` DESC";
    // req.query 包含分页参数，如：part、page、size
    const result = await getList(baseSql, "volunteer_activities", req.query);
    return res.json(jsondata("0000", "获取活动列表成功", result));
  } catch (error) {
    return res.json(jsondata("0001", `获取活动列表失败: ${error.message}`, error));
  }
}

export default getActivityList;
