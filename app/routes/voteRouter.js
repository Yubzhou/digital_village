import express from "express";

// 导入自定义模块
import { executeSql, getConnection, insertMany } from "../utils/dbTools.js";
import jsondata from "../utils/jsondata.js";

const router = express.Router();

// 从数据库读取投票缓存
async function getVoteCache() {
  // 获取投票活动未结束的投票记录
  const sql = "SELECT * FROM `vote_info` WHERE `vote_activity_id` IN (SELECT `activity_id` FROM `vote_activities` WHERE `is_ended`=0);";
  try {
    const result = await executeSql(sql);
    // 解析结果，更新缓存
    const voteCache = {};
    result.forEach((row) => {
      voteCache[row.id] = { voteCount: row.vote_count, activityId: row.vote_activity_id, isChanged: false };
    });
    return voteCache;
  } catch (error) {
    // console.error(error);
    throw error;
  }
}

// 投票缓存
let voteCache;
// 缓存是否发生变化
let isChanged = false;

// 服务启动时读取投票缓存
voteCache = await getVoteCache();
console.log("Vote cache:", voteCache);

/*
voteCache基本结构
voteCache = {
  id1: {voteCount, activityId, isChanged},
  id2: {voteCount, activityId, isChanged},
  id3: {voteCount, activityId, isChanged},
  id4: {voteCount, activityId, isChanged},
  id5: {voteCount, activityId, isChanged},
  ...
}
*/

// 将投票缓存数据更新到数据库
async function updateDB() {
  const sql = "UPDATE `vote_info` SET `vote_count`=? WHERE `id`=? LIMIT 1";
  try {
    // 获取数据库连接
    const connection = await getConnection();
    // 遍历缓存，更新数据库
    for (const id in voteCache) {
      if (voteCache.hasOwnProperty(id)) {
        const candidate = voteCache[id];
        if (candidate.isChanged) {
          const [result] = await connection.execute(sql, [candidate.voteCount, id]);
          result.affectedRows === 1 && (candidate.isChanged = false);
        }
      }
    }
    // 释放连接
    connection.release();
    console.log("Vote cache updated in database.");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// 定时任务，每隔10分钟判断一次，如果缓存发生变化才更新数据库
setInterval(() => isChanged && updateDB() && (isChanged = false), 10 * 60 * 1000);

// 更新投票缓存
function updateVoteCache(id) {
  // 确保id正确（即为正确的投票记录）
  if (!voteCache.hasOwnProperty(id)) {
    throw new Error(`Invalid vote id: ${id}, please check if the id is correct`);
  }

  // 获取投票记录id对应的投票信息，并更新候选人投票数
  const candidate = voteCache[id];
  candidate.voteCount++;
  candidate.isChanged = true;

  // 设置缓存发生变化标志
  isChanged = true;
}

// 获取全部投票活动列表
router.get("/vote/activities", async (req, res) => {
  try {
    const sql = "SELECT * FROM `vote_activities`";
    const result = await executeSql(sql);
    return res.json(jsondata("0000", "获取投票活动列表成功", result));
  } catch (error) {
    return res.json(jsondata("1001", "获取投票活动列表失败", error));
  }
});

// 获取指定投票活动的投票数据
router.get("/vote/:activityId", (req, res) => {
  let activityId = req.params.activityId;

  // 验证activityId是否合法，即是否为正整数
  const isValidActivityId = /^[1-9]\d*$/;
  if (!isValidActivityId.test(activityId)) {
    return res.json(jsondata("1001", "投票活动id不合法", "activityId参数必须为正整数（大于0）"));
  }
  // 转换为整数
  activityId = parseInt(activityId);
  // 获取投票数据
  const voteData = Object.keys(voteCache)
    .filter((id) => voteCache[id].activityId === activityId)
    .map((id) => ({ id, voteCount: voteCache[id].voteCount }));
  console.log(voteData);
  // 成功
  return res.json(jsondata("0000", "获取投票数据成功", { voteData }));
});

// 处理投票逻辑
router.post("/vote", (req, res) => {
  // 获取唯一id
  const id = req.body.id;
  // 验证id是否合法
  const isValidId = /^[1-9]\d*$/;
  if (!isValidId.test(id)) {
    return res.json(jsondata("1001", "投票id不合法", "id参数必须为正整数（大于0）"));
  }
  try {
    // 更新投票缓存
    updateVoteCache(id);
    console.log("Vote cache updated:", voteCache);
    // 成功
    return res.json(jsondata("0000", "投票成功", { id, voteCount: voteCache[id].voteCount }));
  } catch (error) {
    return res.json(jsondata("1002", "投票失败", error));
  }
});

// 发布投票活动
async function postVoteActivity(params) {
  try {
    const sql = "INSERT INTO `vote_activities` (`activity_name`, `description`, `start_time`, `end_time`) VALUES (?,?,?,?)";
    const result = await executeSql(sql, params);
    return result.insertId;
  } catch (error) {
    // console.error(error);
    throw error;
  }
}

// 发布投票活动，需要输入活动名称和描述，以及候选人列表
router.post("/vote/activity", async (req, res) => {
  // 活动名称、描述、候选人列表
  const { activityName, description, startTime, endTime, candidates } = req.body;

  try {
    // 发布投票活动
    const activityId = await postVoteActivity([activityName, description, startTime, endTime]);
    // 获取批量插入的候选人列表
    const inserts = candidates.map((value, index) => [index + 1, value, activityId]);
    // console.log(inserts);
    // 候选人列表插入数据库
    const sql = "INSERT INTO `vote_info` (`candidate_id`, `candidate_name`, `vote_activity_id`) VALUES ?";
    const result = await insertMany(sql, [inserts]);
    // 获取第一个插入的id
    const insertId = result.insertId;
    // 发布成功
    return res.json(jsondata("0000", "发布成功", { activityId, result }));
  } catch (error) {
    return res.json(jsondata("1002", "发布投票活动失败", error));
  }
});

// 在服务关闭时保存缓存数据
async function saveCacheOnExit() {
  if (isChanged) {
    console.log("Saving vote cache before exit...");
    await updateDB();
    isChanged = false; // 缓存已保存，清除标志
    console.log("Vote cache saved.");
  }
}

export { router, saveCacheOnExit };
