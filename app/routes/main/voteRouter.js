import express from "express";

// 导入自定义模块
import { executeSql, getConnection, insertMany } from "../../utils/dbTools.js";
import jsondata from "../../utils/jsondata.js";
import adminAuthMiddleware from "../../middlewares/adminAuthMiddleware.js";
import activityPictureRouter from "./uploads/activityPictureRouter.js";

const router = express.Router();

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // 月份是从0开始的
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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
    // 更新投票活动状态, 即将过期活动置为已结束
    await updateVoteActivities();
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

// 将过期活动置为已结束
async function updateVoteActivities() {
  // 将当前时间与最近一次活动结束时间比较，如果当前时间大于最近一次活动结束时间，则更新数据库，否则退出
  if (latestActiveActivityEndTime === 0) {
    // 如果 latestActiveActivityEndTime 为 0，则说明全部活动都已结束，不需要更新
    console.log("没有活动过期1...");

    return;
  }
  const now = Date.now();
  // 如果当前时间小于最近一次活动结束时间（减去5分钟，以防止误判），则退出（即没有活动过期）
  if (now < latestActiveActivityEndTime - 5 * 60 * 1000) {
    console.log("没有活动过期2...");
    return;
  }

  console.log("开始更新投票活动状态...");

  try {
    // 获取所有未结束的投票活动
    const sql = "SELECT * FROM `vote_activities` WHERE `is_ended`=0";
    const result = await executeSql(sql);

    // 从result中筛选出全部已过期的活动id, 同时获取最近一次活动结束时间
    const now = Date.now();
    let lastEndTime = Infinity;
    const expiredActivityIds = result
      .filter((row) => {
        const { end_time } = row;
        const end = new Date(end_time).getTime();
        if (now < end && end < lastEndTime) {
          lastEndTime = end;
        }
        return end <= now;
      })
      .map((row) => row.activity_id);
    // 更新最近一次未结束活动的结束时间, 当全部活动都已结束时，latestActiveActivityEndTime为0
    latestActiveActivityEndTime = lastEndTime === Infinity ? 0 : lastEndTime;

    console.log("最近一次活动结束时间:", formatTimestamp(latestActiveActivityEndTime));

    // 根据数组长度构建占位符字符串，例如：'?, ?, ?, ?, ?'
    const placeholders = expiredActivityIds.map(() => "?").join(", ");
    if (expiredActivityIds.length > 0) {
      // 存在过期活动，更新数据库
      // 批量更新数据库，将过期活动的状态设置为已结束
      const sql2 = "UPDATE `vote_activities` SET `is_ended`=1 WHERE `activity_id` IN (" + placeholders + ")";
      await executeSql(sql2, [...expiredActivityIds]);

      // 批量更新缓存
      await updateDBPartForEnd(expiredActivityIds);
    }
    console.log("Vote activities is_ended updated.");
  } catch (error) {
    throw error;
  }
}

// 从数据库读取投票缓存, 并将过期活动置为已结束
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
let voteCache = {};
// 投票缓存是否发生变化
let isChanged = false;

// 记录最近一次没过期的活动结束时间，初始化为null
let latestActiveActivityEndTime = null;

// 服务启动时读取投票缓存，异步操作
(async () => {
  try {
    voteCache = await getVoteCache();
    // 更新最近一次没过期的活动结束时间
    await updateVoteActivities();
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
      await updateDBPartForEnd([activityId]);
      console.log("Vote cache partly updated for activity end:", voteCache);
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// 当有活动结束时，将投票数据部分更新到数据库, 传入数组
async function updateDBPartForEnd(activityIds) {
  // 确保数组不为空
  if (voteCache.length === 0 || activityIds.length === 0) return;
  const sql = "UPDATE `vote_info` SET `vote_count`=? WHERE `id`=? LIMIT 1";
  try {
    // 获取数据库连接
    const connection = await getConnection();
    // 遍历缓存，更新数据库
    const ids = Object.keys(voteCache).filter((id) => activityIds.includes(voteCache[id].activityId));
    // 遍历数组
    for (const id of ids) {
      const candidate = voteCache[id];
      if (candidate.isChanged) {
        const [result] = await connection.execute(sql, [candidate.voteCount, id]);
        result.affectedRows > 1 && (candidate.isChanged = false);
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

// 获取全部候选人的照片
async function getCandidateProfiles(activityId) {
  try {
    const sql = "SELECT `id`, `candidate_profile` FROM `vote_info` WHERE `vote_activity_id` =?";
    const candidates = await executeSql(sql, [activityId]);
    const transformed = candidates.reduce((acc, candidate) => {
      acc[candidate.id] = candidate.candidate_profile;
      return acc;
    }, {});
    return transformed;
  } catch (error) {
    throw error;
  }
}

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
  // 获取候选人照片
  const candidateProfiles = await getCandidateProfiles(activityId);
  // 合并数据
  for (const candidate of voteData) {
    candidate.candidateProfile = candidateProfiles[candidate.id];
  }
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
    // 获取候选人
    const candidate = voteCache[id];
    if (!candidate) {
      return res.json(jsondata("1002", "投票失败", "投票活动不存在或已结束"));
    }
    // 插入用户的投票记录
    await insertUserVoteRecord(userID, voteCache[id].activityId);
    // 更新投票缓存
    updateVoteCache(id);
    console.log("Vote cache updated:", voteCache);
    // 成功
    return res.json(jsondata("0000", "投票成功", { id, voteCount: voteCache[id].voteCount }));
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.json(jsondata("1003", "投票失败", "请勿重复投票"));
    }
    return res.json(jsondata("1004", `投票失败: ${error.message}`, error));
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

// 使用图片上传中间件
router.use("/", activityPictureRouter);

// 发布投票活动，需要输入活动名称和描述，以及候选人列表, 需要管理员权限
router.post("/vote/activity", adminAuthMiddleware, async (req, res) => {
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

    const end = new Date(endTime).getTime();
    // 如果latestActiveActivityEndTime为0，说明当前没有活动，则更新latestActiveActivityEndTime为活动结束时间
    // 如果latestActiveActivityEndTime大于新发布的活动结束时间，则更新latestActiveActivityEndTime为新发布的活动结束时间
    if (latestActiveActivityEndTime === 0 || latestActiveActivityEndTime > end) {
      latestActiveActivityEndTime = end;
    }

    console.log("发布活动成功，最近一次活动结束时间:", formatTimestamp(latestActiveActivityEndTime));

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

// 删除投票活动
async function deleteVoteActivity(activityId) {
  try {
    // 删除投票活动会自动删掉对应的投票数据, 因为数据库外键设置了ON DELETE CASCADE
    const sql = "DELETE FROM `vote_activities` WHERE `activity_id`=? LIMIT 1";
    const result = await executeSql(sql, [activityId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw error;
  }
}

// 删除投票活动, 只有活动结束后才能删除, 且需要管理员权限
router.delete("/vote/activity/:activityId", adminAuthMiddleware, async (req, res) => {
  const activityId = req.params.activityId;
  // 验证activityId是否合法，即是否为正整数
  const isValidActivityId = /^[1-9]\d*$/;
  if (!isValidActivityId.test(activityId)) {
    return res.json(jsondata("1001", "投票活动id不合法", "activityId参数必须为正整数（大于0）"));
  }
  let sql, result;
  try {
    // 判断活动是否已结束
    sql = "SELECT `start_time`, `end_time`, `is_ended` FROM `vote_activities` WHERE `activity_id`=? LIMIT 1";
    result = await executeSql(sql, [activityId]);
    if (result.length === 0) {
      return res.json(jsondata("1002", "删除失败", "活动不存在 or 已删除"));
    }
    const activity = result[0];
    const now = Date.now();
    const start = new Date(activity.start_time).getTime();
    const end = new Date(activity.end_time).getTime();
    // 如果is_ended为0，且当前时间在活动开始时间和结束时间之间，则不能删除
    if (activity.is_ended === 0 && start <= now && now < end) {
      return res.json(jsondata("1003", "删除失败", "投票活动正在进行中，删除失败"));
    }
    // 删除活动
    const isSuccess = await deleteVoteActivity(activityId);
    if (!isSuccess) {
      // 失败
      return res.json(jsondata("1004", "删除失败", "活动不存在 or 已删除"));
    }
    // 成功
    if (activity.is_ended === 0 && now < start) {
      // 如果活动还未开始, 允许删除活动
      return res.json(jsondata("0000", "删除成功", "活动尚未开始，删除成功"));
    } else {
      // 活动已结束，允许删除活动
      return res.json(jsondata("0000", "删除成功", "活动已结束，删除成功"));
    }
  } catch (error) {
    console.error(error);
    return res.json(jsondata("1005", `删除投票活动失败: ${error.message}`, error));
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
