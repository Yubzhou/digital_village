import express from "express";

// 导入自定义模块
import { executeSql, getConnection, insertMany } from "../utils/dbTools.js";
import jsondata from "../utils/jsondata.js";

const router = express.Router();

// 投票缓存
let voteCache = {};
// 缓存是否发生变化
let isChanged = false;

/*
voteCache基本结构
voteCache = {
  id1: {voteCount, isChanged},
  id2: {voteCount, isChanged},
  id3: {voteCount, isChanged},
  id4: {voteCount, isChanged},
  id5: {voteCount, isChanged},
  ...
}
*/

// 投票缓存数据更新到数据库
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
  // 确保每个投票记录都有一个对象来存储投票信息
  if (!voteCache.hasOwnProperty(id)) {
    voteCache[id] = { voteCount: 0, isChanged: false };
  }

  // 获取投票记录id对应的投票信息，并更新候选人投票数
  const candidate = voteCache[id];
  candidate.voteCount++;
  candidate.isChanged = true;

  // 设置缓存发生变化标志
  isChanged = true;
}

// 处理投票逻辑
router.post("/vote", (req, res) => {
  // 获取唯一id
  const id = req.body.id;
  // 验证id是否合法
  const isValidId = /^[1-9]\d*$/;
  if (!isValidId.test(id)) {
    return res.json(jsondata("1001", "投票id不合法", "id参数必须为正整数"));
  }
  // 更新投票缓存
  updateVoteCache(id);
  // 成功
  return res.json(jsondata("0000", "投票成功", ""));
});

// 发布投票活动
async function postVoteActivity(activityName, description) {
  try {
    const sql = "INSERT INTO `vote_activities` (`activity_name`, `description`) VALUES (?,?)";
    const result = await executeSql(sql, [activityName, description]);
    return result.insertId;
  } catch (error) {
    // console.error(error);
    throw error;
  }
}

// 发布投票活动，需要输入活动名称和描述，以及候选人列表
router.post("/vote/activity", async (req, res) => {
  // 活动名称、描述、候选人列表
  const { activityName, description, candidates } = req.body;
  // console.log(req.body);

  try {
    // 发布投票活动
    const activityId = await postVoteActivity(activityName, description);
    // 获取批量插入的候选人列表
    const inserts = candidates.map((value, index) => [index + 1, value, activityId]);
    // console.log(inserts);
    // 候选人列表插入数据库
    const sql = "INSERT INTO `vote_info` (`candidate_id`, `candidate_name`, `vote_activity_id`) VALUES ?";
    const result = await insertMany(sql, [inserts]);
    // 发布成功
    return res.json(jsondata("0000", "发布成功", { activityId, result }));
  } catch (error) {
    return res.json(jsondata("1002", "发布投票活动失败", error));
  }
});

export default router;
