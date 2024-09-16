import express from "express";

// 导入自定义模块
import { executeSql, getConnection, insertMany } from "../utils/dbTools.js";
import jsondata from "../utils/jsondata.js";

const router = express.Router();

// 获取不同活动的投票总数
async function getTotolVotes() {
  // 获取已结束活动的投票总数
  const sql = `
    SELECT uv.vote_activity_id AS activity_id,
          COUNT(*)            AS total_votes
    FROM user_vote_records uv
            INNER JOIN
        vote_activities va ON uv.vote_activity_id = va.activity_id
    WHERE va.is_ended = 1
    GROUP BY uv.vote_activity_id;
  `;

  let result;
  try {
    result = await executeSql(sql);
  } catch (error) {
    throw error;
  }

  const totalVotes = result.reduce((acc, cur) => {
    acc[cur.activity_id] = cur.total_votes;
    return acc;
  }, {});

  // 获取未结束活动的投票总数
  for (const id in voteCache) {
    if (voteCache.hasOwnProperty(id)) {
      const activityId = voteCache[id].activityId;
      const voteCount = voteCache[id].voteCount;
      totalVotes[activityId] = (totalVotes[activityId] ?? 0) + voteCount;
    }
  }

  console.log("Total votes:", totalVotes);

  return totalVotes;
}

// 获取投票活动详情
async function getVoteActivity(activityId) {
  try {
    // 获取投票活动详情
    const sql = "SELECT * FROM `vote_activities` WHERE `activity_id`=?";
    const result = await executeSql(sql, [activityId]);
    return result[0];
  } catch (error) {
    throw error;
  }
}

// 获取全部投票活动列表
async function getVoteActivities() {
  try {
    // 获取投票活动列表
    const sql = "SELECT * FROM `vote_activities`";
    const result = await executeSql(sql);
    // 获取每个投票活动的投票总数
    const totalVotes = await getTotolVotes();
    for (const row of result) {
      row.total_votes = totalVotes[row.activity_id] || 0;
    }
    return result;
  } catch (error) {
    throw error;
  }
}

// 从数据库读取投票缓存
async function getVoteCache() {
  // 投票缓存
  const voteCache = {};
  try {
    // 获取投票活动未结束的投票记录
    const sql = "SELECT * FROM `vote_info` WHERE `vote_activity_id` IN (SELECT `activity_id` FROM `vote_activities` WHERE `is_ended`=0);";
    const result = await executeSql(sql);
    result.forEach((row) => {
      voteCache[row.id] = { voteCount: row.vote_count, activityId: row.vote_activity_id, candidateName: row.candidate_name, isChanged: false };
    });
    return voteCache;
  } catch (error) {
    throw error;
  }
}

// 投票缓存
let voteCache;
// 投票缓存是否发生变化
let isChanged = false;

// 服务启动时读取投票缓存，异步操作
(async () => {
  try {
    voteCache = await getVoteCache();
    console.log("Vote cache:", voteCache);
  } catch (error) {
    console.error("Failed to initialize vote cache:", error);
  }
})();

/*
voteCache基本结构
voteCache = {
  id1: {voteCount, activityId, candidateName, isChanged},
  id2: {voteCount, activityId, candidateName, isChanged},
  id3: {voteCount, activityId, candidateName, isChanged},
  id4: {voteCount, activityId, candidateName, isChanged},
  id5: {voteCount, activityId, candidateName, isChanged},
  ...
}
*/

// 将投票缓存数据全部更新到数据库
async function updateDBAll() {
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
    // 更新缓存标志
    isChanged = false;
    console.log("Vote cache updated in database.");
  } catch (error) {
    // console.error(error);
    throw error;
  }
}

// 活动结束
async function endActivity(activityId) {
  // 将活动状态设置为已结束
  const sql = "UPDATE `vote_activities` SET `is_ended`=1 WHERE `activity_id`=? AND `is_ended`=0 LIMIT 1";
  try {
    const result = await executeSql(sql, [activityId]);
    if (result.affectedRows === 1) {
      // 更新缓存
      await updateDBPartForEnd(activityId);
      console.log("Vote cache partly updated for activity end:", voteCache);
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// 当有活动结束时，将投票数据部分更新到数据库
async function updateDBPartForEnd(activityId) {
  const sql = "UPDATE `vote_info` SET `vote_count`=? WHERE `id`=? LIMIT 1";
  try {
    // 获取数据库连接
    const connection = await getConnection();
    // 遍历缓存，更新数据库
    const ids = Object.keys(voteCache).filter((id) => voteCache[id].activityId === activityId);
    // 遍历数组
    for (const id of ids) {
      const candidate = voteCache[id];
      if (candidate.isChanged) {
        const [result] = await connection.execute(sql, [candidate.voteCount, id]);
        result.affectedRows === 1 && (candidate.isChanged = false);
      }
      // 移除缓存中已结束的投票记录
      delete voteCache[id];
    }
    // 释放连接
    connection.release();
    // 更新缓存标志
    // isChanged = false; // 部分更新不需要更新缓存标志
    console.log("Vote cache partly updated in database.");
  } catch (error) {
    throw error;
  }
}

// 定时任务，每隔10分钟判断一次，如果缓存发生变化才更新数据库
setInterval(async () => {
  if (isChanged) {
    try {
      await updateDBAll();
    } catch (error) {
      console.error(error);
    }
  }
}, 10 * 60 * 1000);

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
    const result = await getVoteActivities();
    return res.json(jsondata("0000", "获取投票活动列表成功", result));
  } catch (error) {
    return res.json(jsondata("1001", `获取投票活动列表失败: ${error.message}`, error));
  }
});

// 查询用户是否已经投票
async function getUserVoteRecord(userID, activityId) {
  // 获取用户的投票记录
  const sql = "SELECT EXISTS(SELECT 1 FROM `user_vote_records` WHERE `user_id`=? AND `vote_activity_id`=? LIMIT 1) AS is_voted";
  try {
    const result = await executeSql(sql, [userID, activityId]);
    return result[0].is_voted;
  } catch (error) {
    throw error;
  }
}

// 插入用户的投票记录
async function insertUserVoteRecord(userID, activityId) {
  // 更新用户的投票记录
  const sql = "INSERT INTO `user_vote_records` (`user_id`, `vote_activity_id`) VALUES (?,?)";
  try {
    await executeSql(sql, [userID, activityId]);
  } catch (error) {
    throw error;
  }
}

// 查询用户是否已经投票
router.get("/vote/user-vote-record/:activityId", async (req, res) => {
  // 获取用户id
  const { sub: userID } = req.auth;
  // 获取投票活动id
  let activityId = req.params.activityId;
  // 验证activityId是否合法，即是否为正整数
  const isValidActivityId = /^[1-9]\d*$/;
  if (!isValidActivityId.test(activityId)) {
    return res.json(jsondata("1001", "投票活动id不合法", "activityId参数必须为正整数（大于0）"));
  }
  // 转为整数
  activityId = parseInt(activityId);
  try {
    const isVoted = await getUserVoteRecord(userID, activityId);
    return res.json(jsondata("0000", "查询投票状态成功", { isVoted }));
  } catch (error) {
    return res.json(jsondata("1002", `查询投票状态失败: ${error.message}`, error));
  }
});

// 获取指定投票活动的投票数据
router.get("/vote/:activityId", async (req, res) => {
  let activityId = req.params.activityId;

  // 验证activityId是否合法，即是否为正整数
  const isValidActivityId = /^[1-9]\d*$/;
  if (!isValidActivityId.test(activityId)) {
    return res.json(jsondata("1001", "投票活动id不合法", "activityId参数必须为正整数（大于0）"));
  }
  // 转换为整数
  activityId = parseInt(activityId);
  // 获取投票活动详情
  const activity = await getVoteActivity(activityId);
  // 获取投票数据
  const voteData = Object.keys(voteCache)
    .filter((id) => voteCache[id].activityId === activityId)
    .map((id) => ({ id, candidateName: voteCache[id].candidateName, voteCount: voteCache[id].voteCount }));
  // console.log(voteData);
  const totalVotes = voteData.reduce((acc, cur) => acc + cur.voteCount, 0);
  // 成功
  return res.json(jsondata("0000", "获取投票数据成功", { activity, totalVotes, voteData }));
});

// 处理投票逻辑
router.post("/vote", async (req, res) => {
  // 获取用户id
  const { sub: userID } = req.auth;
  // 获取投票记录唯一id
  const id = req.body.id;
  // 验证投票记录id是否合法
  const isValidId = /^[1-9]\d*$/;
  if (!isValidId.test(id)) {
    return res.json(jsondata("1001", "投票id不合法", "id参数必须为正整数（大于0）"));
  }
  try {
    // 插入用户的投票记录
    await insertUserVoteRecord(userID, voteCache[id].activityId);
    // 更新投票缓存
    updateVoteCache(id);
    console.log("Vote cache updated:", voteCache);
    // 成功
    return res.json(jsondata("0000", "投票成功", { id, voteCount: voteCache[id].voteCount }));
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.json(jsondata("1002", "投票失败", "请勿重复投票"));
    }
    return res.json(jsondata("1003", `投票失败: ${error.message}`, error));
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
    // 更新投票缓存，将新插入的候选人列表的投票数初始化为0
    for (let i = 0; i < candidates.length; i++) {
      voteCache[insertId + i] = { voteCount: 0, activityId, candidateName: candidates[i], isChanged: false };
    }
    // console.log("Vote cache updated:", voteCache);

    // 发布成功
    return res.json(jsondata("0000", "发布成功", { activityId, result }));
  } catch (error) {
    return res.json(jsondata("1002", `发布投票活动失败: ${error.message}`, error));
  }
});

// 如果活动结束，则将缓存数据更新到数据库
router.post("/vote/activity/end", async (req, res) => {
  const activityId = req.body.activityId;
  // 验证activityId是否合法，即是否为正整数
  const isValidActivityId = /^[1-9]\d*$/;
  if (!isValidActivityId.test(activityId)) {
    return res.json(jsondata("1001", "投票活动id不合法", "activityId参数必须为正整数（大于0）"));
  }
  try {
    // 结束活动
    const isSuccess = await endActivity(activityId);
    if (!isSuccess) {
      return res.json(jsondata("1001", "活动结束失败", "活动不存在或已结束"));
    }
    // 成功
    return res.json(jsondata("0000", "活动结束成功", ""));
  } catch (error) {
    // console.error(error);
    return res.json(jsondata("1002", `活动结束失败: ${error.message}`, error));
  }
});

// 在服务关闭时保存缓存数据
async function saveCacheOnExit() {
  if (isChanged) {
    console.log("Saving vote cache before exit...");
    try {
      await updateDBAll();
    } catch (error) {
      console.error(error);
    }
    console.log("Vote cache saved.");
  }
}

export { router, saveCacheOnExit };
